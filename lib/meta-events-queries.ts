import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { getSince, type Range } from "@/lib/dashboard-queries"

// Conciliação lead a lead entre o banco e o que foi enviado ao Meta.
// Servidor: evento "meta_capi_lead" (gravado em app/actions/submit-lead.ts, ligado
// ao lead por data.leadId). Navegador: evento "meta_pixel_lead" (gravado pelo
// tracker, ligado ao servidor pelo eventId compartilhado usado na deduplicação).

export type ServerLog = {
  status: "sent" | "error" | "no_token" | "not_qualified" | "no_event_id"
  httpStatus?: number
  eventsReceived?: number
  fbtraceId?: string
  error?: string
  testEventCode?: string
  hasFbp?: boolean
  hasFbc?: boolean
  eventId?: string | null
}

export type BrowserStatus = "sent" | "script_not_loaded" | "fbq_missing" | "not_qualified"

export type MetaEventRow = {
  leadId: string
  nome: string
  empresa: string
  qualified: boolean
  createdAt: string
  server: ServerLog | null
  browser: BrowserStatus | null
}

export type MetaEventsData = {
  summary: {
    qualifiedLeads: number
    serverReceived: number
    serverReceivedTestMode: number
    serverFailed: number
    serverNoToken: number
    serverMissing: number
    browserSent: number
    browserBlocked: number
    browserMissing: number
    withFbc: number
  }
  rows: MetaEventRow[]
}

type RawRow = {
  id: string
  nome: string
  empresa: string
  qualified: boolean
  createdAt: Date
  server: ServerLog | null
  browser: BrowserStatus | null
}

export async function getMetaEventsData(range: Range): Promise<MetaEventsData> {
  const since = getSince(range)
  const leadSince = since ? Prisma.sql`WHERE "createdAt" >= ${since}` : Prisma.empty
  const eventSince = since ? Prisma.sql`AND ts >= ${since}` : Prisma.empty

  const raw = await db.$queryRaw<RawRow[]>`
    WITH s AS (
      SELECT DISTINCT ON (data->>'leadId') data->>'leadId' AS lead_id, data
      FROM events
      WHERE type = 'meta_capi_lead' ${eventSince}
      ORDER BY data->>'leadId', ts DESC
    ),
    b AS (
      SELECT DISTINCT ON (data->>'eventId') data->>'eventId' AS event_id, data->>'status' AS status
      FROM events
      WHERE type = 'meta_pixel_lead' AND data->>'eventId' IS NOT NULL ${eventSince}
      ORDER BY data->>'eventId', ts DESC
    )
    SELECT l.id, l.nome, l.empresa, l.qualified, l."createdAt", s.data AS server, b.status AS browser
    FROM (SELECT * FROM leads ${leadSince}) l
    LEFT JOIN s ON s.lead_id = l.id
    LEFT JOIN b ON b.event_id = s.data->>'eventId'
    ORDER BY l."createdAt" DESC
  `

  // Leads criados antes deste log existir não têm linha de servidor nem de
  // navegador — contar como "sem registro" distorceria o resumo.
  const logged = raw.filter((r) => r.server)
  const qualified = logged.filter((r) => r.qualified)

  return {
    summary: {
      qualifiedLeads: qualified.length,
      serverReceived: qualified.filter(
        (r) => r.server?.status === "sent" && !r.server.testEventCode
      ).length,
      serverReceivedTestMode: qualified.filter(
        (r) => r.server?.status === "sent" && !!r.server.testEventCode
      ).length,
      serverFailed: qualified.filter(
        (r) => r.server?.status === "error" || r.server?.status === "no_event_id"
      ).length,
      serverNoToken: qualified.filter((r) => r.server?.status === "no_token").length,
      serverMissing: raw.filter((r) => r.qualified && !r.server).length,
      browserSent: qualified.filter((r) => r.browser === "sent").length,
      browserBlocked: qualified.filter(
        (r) => r.browser === "script_not_loaded" || r.browser === "fbq_missing"
      ).length,
      browserMissing: qualified.filter((r) => !r.browser).length,
      withFbc: qualified.filter((r) => r.server?.hasFbc).length,
    },
    rows: raw.slice(0, 50).map((r) => ({
      leadId: r.id,
      nome: r.nome,
      empresa: r.empresa,
      qualified: r.qualified,
      createdAt: r.createdAt.toISOString(),
      server: r.server,
      browser: r.browser,
    })),
  }
}
