import { db } from "@/lib/db"
import { content } from "@/lib/content"
import { getSince, type Range } from "@/lib/dashboard-queries"

// Eventos gravados por lib/use-youtube-tracking.ts via tracker (/api/track).
// O vídeo da /obrigado não aparece aqui: aquela página não monta o Tracker,
// então só manda para o Clarity.

type VideoRow = {
  videoId: string
  plays: bigint
  p25: bigint
  p50: bigint
  p75: bigint
  completes: bigint
  avgSeconds: number | null
}

type GroupRow = {
  variant: string
  played: boolean
  sawSection: boolean
  sessions: bigint
  converted: bigint
  qualified: bigint
}

export type VideoStats = {
  videoId: string
  label: string
  plays: number
  p25: number
  p50: number
  p75: number
  completes: number
  avgSeconds: number | null
}

export type ConversionGroup = {
  sessions: number
  converted: number
  qualified: number
  conversionRate: number
  qualifiedRate: number
}

export type VideoData = {
  videos: VideoStats[]
  sawSection: number
  playedAny: number
  playRate: number
  watched: ConversionGroup
  sawNotWatched: ConversionGroup
  didNotSee: ConversionGroup
  byVariant: {
    variant: string
    sessions: number
    playRate: number
    watchedConversion: number
    notWatchedConversion: number
  }[]
}

const VIDEO_LABELS: Record<string, string> = Object.fromEntries(
  content.testimonials.videos.map((v, i) => [v.videoId, `Depoimento ${i + 1} · ${v.badgeLabel}`]),
)

function group(rows: GroupRow[]): ConversionGroup {
  const sessions = rows.reduce((n, r) => n + Number(r.sessions), 0)
  const converted = rows.reduce((n, r) => n + Number(r.converted), 0)
  const qualified = rows.reduce((n, r) => n + Number(r.qualified), 0)
  return {
    sessions,
    converted,
    qualified,
    conversionRate: sessions > 0 ? (converted / sessions) * 100 : 0,
    qualifiedRate: sessions > 0 ? (qualified / sessions) * 100 : 0,
  }
}

export async function getVideoData(range: Range): Promise<VideoData> {
  const since = getSince(range) ?? new Date(0)

  const [videoRows, groupRows] = await Promise.all([
    // Tempo assistido: maior valor reportado por sessão+vídeo (o evento é
    // cumulativo e pode chegar várias vezes), depois média entre sessões.
    db.$queryRaw<VideoRow[]>`
      WITH watch AS (
        SELECT data->>'videoId' AS "videoId", "sessionId", MAX((data->>'seconds')::numeric) AS seconds
        FROM events
        WHERE type IN ('video_watch_time', 'video_complete') AND ts >= ${since}
        GROUP BY 1, 2
      ),
      funnel AS (
        SELECT
          data->>'videoId' AS "videoId",
          COUNT(DISTINCT "sessionId") FILTER (WHERE type = 'video_play') AS plays,
          COUNT(DISTINCT "sessionId") FILTER (WHERE type = 'video_progress' AND data->>'percent' = '25') AS p25,
          COUNT(DISTINCT "sessionId") FILTER (WHERE type = 'video_progress' AND data->>'percent' = '50') AS p50,
          COUNT(DISTINCT "sessionId") FILTER (WHERE type = 'video_progress' AND data->>'percent' = '75') AS p75,
          COUNT(DISTINCT "sessionId") FILTER (WHERE type = 'video_complete') AS completes
        FROM events
        WHERE type IN ('video_play', 'video_progress', 'video_complete') AND ts >= ${since}
        GROUP BY 1
      )
      SELECT f.*, (SELECT AVG(w.seconds)::float FROM watch w WHERE w."videoId" = f."videoId") AS "avgSeconds"
      FROM funnel f
    `,
    db.$queryRaw<GroupRow[]>`
      WITH s AS (
        SELECT
          COALESCE(substring(se."landingUrl" from '/(lp-[0-9]{2})'), 'home') AS variant,
          EXISTS (SELECT 1 FROM events e WHERE e."sessionId" = se.id AND e.type = 'video_play') AS played,
          EXISTS (
            SELECT 1 FROM events e
            WHERE e."sessionId" = se.id AND e.type = 'section_view' AND e.data->>'section' = 'testimonials'
          ) AS "sawSection",
          EXISTS (SELECT 1 FROM leads l WHERE l."sessionId" = se.id) AS converted,
          EXISTS (SELECT 1 FROM leads l WHERE l."sessionId" = se.id AND l.qualified) AS qualified
        FROM sessions se
        WHERE se."startedAt" >= ${since}
      )
      SELECT
        variant,
        played,
        "sawSection",
        COUNT(*) AS sessions,
        COUNT(*) FILTER (WHERE converted) AS converted,
        COUNT(*) FILTER (WHERE qualified) AS qualified
      FROM s
      GROUP BY 1, 2, 3
    `,
  ])

  const videos = videoRows
    .map((r) => ({
      videoId: r.videoId,
      label: VIDEO_LABELS[r.videoId] ?? r.videoId,
      plays: Number(r.plays),
      p25: Number(r.p25),
      p50: Number(r.p50),
      p75: Number(r.p75),
      completes: Number(r.completes),
      avgSeconds: r.avgSeconds,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  // Play sem section_view acontece (seção visível < 30% no threshold do
  // observer); conta como "viu a seção" para a taxa de play não passar de 100%.
  const watchedRows = groupRows.filter((r) => r.played)
  const sawNotWatchedRows = groupRows.filter((r) => !r.played && r.sawSection)
  const didNotSeeRows = groupRows.filter((r) => !r.played && !r.sawSection)

  const watched = group(watchedRows)
  const sawSection = watched.sessions + group(sawNotWatchedRows).sessions

  const variants = [...new Set(groupRows.map((r) => r.variant))].sort()
  const byVariant = variants.map((variant) => {
    const rows = groupRows.filter((r) => r.variant === variant)
    const w = group(rows.filter((r) => r.played))
    const nw = group(rows.filter((r) => !r.played && r.sawSection))
    const seen = w.sessions + nw.sessions
    return {
      variant,
      sessions: group(rows).sessions,
      playRate: seen > 0 ? (w.sessions / seen) * 100 : 0,
      watchedConversion: w.conversionRate,
      notWatchedConversion: nw.conversionRate,
    }
  })

  return {
    videos,
    sawSection,
    playedAny: watched.sessions,
    playRate: sawSection > 0 ? (watched.sessions / sawSection) * 100 : 0,
    watched,
    sawNotWatched: group(sawNotWatchedRows),
    didNotSee: group(didNotSeeRows),
    byVariant,
  }
}
