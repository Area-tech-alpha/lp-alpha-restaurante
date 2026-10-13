import { db } from "@/lib/db"
import { getSince, type Range } from "@/lib/dashboard-queries"
import type { ClarityMetric } from "@/lib/clarity-api"

// A Microsoft documenta só os campos de "Traffic"; o resto é localizado por
// padrão de nome (ex: /scroll/i em ScrollDepth). Se o Clarity renomear algo, o
// valor vira null e a célula mostra "—", sem quebrar o dashboard — e o payload
// cru continua em clarity_snapshots para reprocessar.

const SP_OFFSET_MS = 3 * 60 * 60 * 1000
const ROW_LIMIT = 1000

const FRUSTRATION_METRICS = {
  DeadClickCount: "deadClick",
  RageClickCount: "rageClick",
  QuickbackClick: "quickback",
  ExcessiveScroll: "excessiveScroll",
  ScriptErrorCount: "scriptError",
  ErrorClickCount: "errorClick",
} as const

type FrustrationKey = (typeof FRUSTRATION_METRICS)[keyof typeof FRUSTRATION_METRICS]

export type ClarityRow = {
  variant: string
  device: string
  sessions: number
  botPct: number | null
  scrollDepth: number | null
  activeTimeSec: number | null
  totalTimeSec: number | null
} & Record<FrustrationKey, number | null>

export type ClarityData = {
  days: number
  firstDate: string | null
  lastDate: string | null
  byDevice: ClarityRow[]
  byVariant: ClarityRow[]
  truncated: boolean
}

type Weighted = { sum: number; weight: number }

type Acc = {
  sessions: number
  bots: number
  scroll: Weighted
  active: Weighted
  total: Weighted
  frustration: Partial<Record<FrustrationKey, Weighted>>
}

function toNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value
  return typeof n === "number" && Number.isFinite(n) ? n : null
}

function findNumber(row: Record<string, unknown>, pattern: RegExp, exclude?: RegExp): number | null {
  for (const [key, value] of Object.entries(row)) {
    if (!pattern.test(key) || exclude?.test(key)) continue
    const n = toNumber(value)
    if (n !== null) return n
  }
  return null
}

function variantFromUrl(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "(sem URL)"
  let path = raw
  try {
    path = new URL(raw).pathname
  } catch {
    path = raw.split("?")[0]
  }
  const lp = path.match(/lp-[0-9]{2}/)
  if (lp) return lp[0]
  const clean = path.replace(/\/+$/, "")
  return clean === "" ? "home" : clean
}

function emptyAcc(): Acc {
  return {
    sessions: 0,
    bots: 0,
    scroll: { sum: 0, weight: 0 },
    active: { sum: 0, weight: 0 },
    total: { sum: 0, weight: 0 },
    frustration: {},
  }
}

function add(w: Weighted, value: number | null, weight: number) {
  if (value === null) return
  w.sum += value * weight
  w.weight += weight
}

const avg = (w: Weighted | undefined) => (w && w.weight > 0 ? w.sum / w.weight : null)

function accumulate(
  snapshots: ClarityMetric[][],
  keyOf: (row: Record<string, unknown>) => { variant: string; device: string },
): ClarityRow[] {
  const accs = new Map<string, { variant: string; device: string; acc: Acc }>()
  const get = (row: Record<string, unknown>) => {
    const k = keyOf(row)
    const id = `${k.variant}|${k.device}`
    if (!accs.has(id)) accs.set(id, { ...k, acc: emptyAcc() })
    return accs.get(id)!.acc
  }

  for (const payload of snapshots) {
    for (const metric of payload) {
      for (const row of metric.information ?? []) {
        const acc = get(row)
        const weight = findNumber(row, /^(sessionsCount|totalSessionCount)$/i) ?? 1

        if (metric.metricName === "Traffic") {
          acc.sessions += toNumber(row.totalSessionCount) ?? 0
          acc.bots += toNumber(row.totalBotSessionCount) ?? 0
        } else if (metric.metricName === "ScrollDepth") {
          add(acc.scroll, findNumber(row, /scroll/i), weight)
        } else if (metric.metricName === "EngagementTime") {
          add(acc.active, findNumber(row, /active/i), weight)
          add(acc.total, findNumber(row, /total.*time/i), weight)
        } else if (metric.metricName in FRUSTRATION_METRICS) {
          const key = FRUSTRATION_METRICS[metric.metricName as keyof typeof FRUSTRATION_METRICS]
          acc.frustration[key] ??= { sum: 0, weight: 0 }
          add(acc.frustration[key], findNumber(row, /percentage/i, /without/i), weight)
        }
      }
    }
  }

  return [...accs.values()]
    .map(({ variant, device, acc }) => {
      const humans = acc.sessions
      return {
        variant,
        device,
        sessions: humans,
        botPct: humans + acc.bots > 0 ? (acc.bots / (humans + acc.bots)) * 100 : null,
        scrollDepth: avg(acc.scroll),
        activeTimeSec: avg(acc.active),
        totalTimeSec: avg(acc.total),
        deadClick: avg(acc.frustration.deadClick),
        rageClick: avg(acc.frustration.rageClick),
        quickback: avg(acc.frustration.quickback),
        excessiveScroll: avg(acc.frustration.excessiveScroll),
        scriptError: avg(acc.frustration.scriptError),
        errorClick: avg(acc.frustration.errorClick),
      }
    })
    .filter((r) => r.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions)
}

function deviceOf(row: Record<string, unknown>) {
  return typeof row.Device === "string" && row.Device ? row.Device : "(desconhecido)"
}

export async function getClarityData(range: Range): Promise<ClarityData> {
  const since = getSince(range)
  // Snapshots são datados pelo dia de Brasília (00:00Z daquela data).
  const sinceDate = since
    ? new Date(`${new Date(since.getTime() - SP_OFFSET_MS).toISOString().slice(0, 10)}T00:00:00.000Z`)
    : null

  // Painel secundário: uma falha aqui (ex: migration ainda não aplicada) não
  // pode derrubar o dashboard inteiro.
  const snapshots = await db.claritySnapshot
    .findMany({
      where: sinceDate ? { date: { gte: sinceDate } } : {},
      orderBy: { date: "asc" },
    })
    .catch((err) => {
      console.error("[clarity-queries] erro:", err)
      return []
    })

  const byDims = (dims: string) =>
    snapshots.filter((s) => s.dimensions === dims).map((s) => s.payload as unknown as ClarityMetric[])

  const deviceSnapshots = byDims("Device")
  const urlSnapshots = byDims("URL,Device")
  const dates = [...new Set(snapshots.map((s) => s.date.toISOString().slice(0, 10)))]

  return {
    days: dates.length,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
    byDevice: accumulate(deviceSnapshots, (row) => ({ variant: "Todas", device: deviceOf(row) })),
    byVariant: accumulate(urlSnapshots, (row) => ({
      variant: variantFromUrl(row.URL ?? row.Url ?? row.url),
      device: deviceOf(row),
    })),
    truncated: urlSnapshots.some((p) => p.some((m) => (m.information?.length ?? 0) >= ROW_LIMIT)),
  }
}
