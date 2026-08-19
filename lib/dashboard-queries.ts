import { db } from "@/lib/db"

export type Range = "hoje" | "7d" | "30d" | "90d" | "all"

// América/São_Paulo não observa horário de verão desde 2019: UTC-3 fixo.
const SP_OFFSET_MS = 3 * 60 * 60 * 1000

function startOfTodaySaoPaulo(): Date {
  const spLocal = new Date(Date.now() - SP_OFFSET_MS)
  spLocal.setUTCHours(0, 0, 0, 0)
  return new Date(spLocal.getTime() + SP_OFFSET_MS)
}

function getSince(range: Range): Date | null {
  if (range === "all") return null
  if (range === "hoje") return startOfTodaySaoPaulo()
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
  return new Date(Date.now() - days * 86_400_000)
}

type TimeRow = { day: Date; count: bigint }
type GroupRow = { label: string | null; count: bigint }
type DeviceRow = { device: string | null; count: bigint }
type CountRow = { count: bigint }
type FieldRow = { field: string | null; count: bigint }

const FORM_FIELD_LABELS: Record<string, string> = {
  nome: "Nome",
  email: "E-mail",
  telefone: "Telefone",
  empresa: "Empresa",
  segmento: "Segmento",
  faturamento: "Faturamento",
  cnpj: "CNPJ",
  investiria: "Investiria",
}

async function distinctSessionCount(type: string, since: Date | null): Promise<number> {
  const rows = since
    ? await db.$queryRaw<CountRow[]>`
        SELECT COUNT(DISTINCT "sessionId") AS count FROM events
        WHERE type = ${type} AND ts >= ${since}
      `
    : await db.$queryRaw<CountRow[]>`
        SELECT COUNT(DISTINCT "sessionId") AS count FROM events WHERE type = ${type}
      `
  return Number(rows[0]?.count ?? 0)
}

export type DashboardData = {
  kpis: {
    totalSessions: number
    totalLeads: number
    qualifiedLeads: number
    conversionRate: number
    qualificationRate: number
    formCompletionRate: number
  }
  leadsOverTime: { day: string; leads: number }[]
  byUtmSource: { label: string; leads: number }[]
  bySegmento: { label: string; leads: number }[]
  byFaturamento: { label: string; leads: number }[]
  byDevice: { label: string; leads: number }[]
  funnel: { stage: string; count: number }[]
  dropOffByField: { field: string; count: number }[]
  submitErrors: { reason: string; count: number }[]
  leadDbWriteFailures: number
  recentLeads: {
    id: string
    nome: string
    email: string
    empresa: string
    segmento: string
    qualified: boolean
    utmSource: string | null
    createdAt: string
  }[]
}

export async function getDashboardData(range: Range): Promise<DashboardData> {
  const since = getSince(range)
  const dateFilter = since ? { gte: since } : undefined

  const [totalSessions, totalLeads, qualifiedLeads] = await Promise.all([
    db.session.count({ where: since ? { startedAt: { gte: since } } : {} }),
    db.lead.count({ where: since ? { createdAt: dateFilter } : {} }),
    db.lead.count({
      where: { qualified: true, ...(since ? { createdAt: dateFilter } : {}) },
    }),
  ])

  // Leads over time (daily) — raw query needed for DATE_TRUNC
  const rawTimeRows = since
    ? await db.$queryRaw<TimeRow[]>`
        SELECT DATE_TRUNC('day', "createdAt" AT TIME ZONE 'America/Sao_Paulo') AS day,
               COUNT(*) AS count
        FROM leads
        WHERE "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1
      `
    : await db.$queryRaw<TimeRow[]>`
        SELECT DATE_TRUNC('day', "createdAt" AT TIME ZONE 'America/Sao_Paulo') AS day,
               COUNT(*) AS count
        FROM leads
        GROUP BY 1
        ORDER BY 1
      `

  const leadsOverTime = rawTimeRows.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    leads: Number(r.count),
  }))

  // Leads by UTM source
  const utmRows = await db.lead.groupBy({
    by: ["utmSource"],
    _count: { id: true },
    where: since ? { createdAt: dateFilter } : {},
    orderBy: { _count: { id: "desc" } },
  })

  const byUtmSource = utmRows.map((r) => ({
    label: r.utmSource ?? "(direto)",
    leads: r._count.id,
  }))

  // Leads by segmento
  const segRows = await db.lead.groupBy({
    by: ["segmento"],
    _count: { id: true },
    where: since ? { createdAt: dateFilter } : {},
    orderBy: { _count: { id: "desc" } },
  })

  const bySegmento = segRows.map((r) => ({
    label: r.segmento,
    leads: r._count.id,
  }))

  // Leads by faturamento — keep natural insertion order (revenue brackets)
  const fatRows = await db.lead.groupBy({
    by: ["faturamento"],
    _count: { id: true },
    where: since ? { createdAt: dateFilter } : {},
  })

  const FATURAMENTO_ORDER = [
    "Até 30 mil",
    "De 30 a 60 mil",
    "De 60 a 100 mil",
    "De 100 a 200 mil",
    "De 200 a 300 mil",
    "De 300 a 500 mil",
    "De 500 mil a 1 milhão",
    "Acima de 1 milhão",
  ]

  const byFaturamento = fatRows
    .sort(
      (a, b) =>
        FATURAMENTO_ORDER.indexOf(a.faturamento) -
        FATURAMENTO_ORDER.indexOf(b.faturamento)
    )
    .map((r) => ({ label: r.faturamento, leads: r._count.id }))

  // Leads by device type via JOIN on sessions
  const rawDeviceRows = since
    ? await db.$queryRaw<DeviceRow[]>`
        SELECT s."deviceType" AS device, COUNT(l.id) AS count
        FROM leads l
        JOIN sessions s ON l."sessionId" = s.id
        WHERE l."createdAt" >= ${since}
        GROUP BY 1
      `
    : await db.$queryRaw<DeviceRow[]>`
        SELECT s."deviceType" AS device, COUNT(l.id) AS count
        FROM leads l
        JOIN sessions s ON l."sessionId" = s.id
        GROUP BY 1
      `

  const byDevice = rawDeviceRows.map((r) => ({
    label: r.device ?? "desconhecido",
    leads: Number(r.count),
  }))

  // Recent leads
  const recentRaw = await db.lead.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    where: since ? { createdAt: dateFilter } : {},
    select: {
      id: true,
      nome: true,
      email: true,
      empresa: true,
      segmento: true,
      qualified: true,
      utmSource: true,
      createdAt: true,
    },
  })

  const recentLeads = recentRaw.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }))

  // Funil do formulário — sessões distintas por estágio
  const [formViews, formAttempts, formSuccesses] = await Promise.all([
    distinctSessionCount("form_view", since),
    distinctSessionCount("form_submit_attempt", since),
    distinctSessionCount("form_submit_success", since),
  ])

  const funnel = [
    { stage: "Visitas", count: totalSessions },
    { stage: "Viu o formulário", count: formViews },
    { stage: "Tentou enviar", count: formAttempts },
    { stage: "Enviou com sucesso", count: formSuccesses },
  ]

  // Drop-off por campo — último campo tocado antes de abandonar o formulário
  const rawFieldRows = since
    ? await db.$queryRaw<FieldRow[]>`
        SELECT data->>'lastField' AS field, COUNT(*) AS count
        FROM events
        WHERE type = 'form_abandon' AND data->>'lastField' IS NOT NULL AND ts >= ${since}
        GROUP BY 1
        ORDER BY count DESC
      `
    : await db.$queryRaw<FieldRow[]>`
        SELECT data->>'lastField' AS field, COUNT(*) AS count
        FROM events
        WHERE type = 'form_abandon' AND data->>'lastField' IS NOT NULL
        GROUP BY 1
        ORDER BY count DESC
      `

  const dropOffByField = rawFieldRows.map((r) => ({
    field: FORM_FIELD_LABELS[r.field ?? ""] ?? r.field ?? "(desconhecido)",
    count: Number(r.count),
  }))

  // Motivos de falha no envio — por que o "Tentou enviar" não virou "Enviou com sucesso"
  const rawSubmitErrorRows = since
    ? await db.$queryRaw<GroupRow[]>`
        SELECT
          CASE
            WHEN type = 'form_validation_error' THEN 'Erro de validação (campo inválido)'
            WHEN type = 'form_submit_error' AND data->>'reason' = 'server' THEN 'Erro no servidor (webhook/CRM)'
            WHEN type = 'form_submit_error' AND data->>'reason' = 'network' THEN 'Erro de conexão do visitante'
            ELSE 'Outro'
          END AS label,
          COUNT(*) AS count
        FROM events
        WHERE type IN ('form_validation_error', 'form_submit_error') AND ts >= ${since}
        GROUP BY 1
        ORDER BY count DESC
      `
    : await db.$queryRaw<GroupRow[]>`
        SELECT
          CASE
            WHEN type = 'form_validation_error' THEN 'Erro de validação (campo inválido)'
            WHEN type = 'form_submit_error' AND data->>'reason' = 'server' THEN 'Erro no servidor (webhook/CRM)'
            WHEN type = 'form_submit_error' AND data->>'reason' = 'network' THEN 'Erro de conexão do visitante'
            ELSE 'Outro'
          END AS label,
          COUNT(*) AS count
        FROM events
        WHERE type IN ('form_validation_error', 'form_submit_error')
        GROUP BY 1
        ORDER BY count DESC
      `

  const submitErrors = rawSubmitErrorRows.map((r) => ({
    reason: r.label ?? "Outro",
    count: Number(r.count),
  }))

  // Leads que o webhook/CRM recebeu mas que falharam ao salvar em "leads" —
  // ficam invisíveis no dashboard sem esse contador.
  const leadDbWriteFailures = await distinctSessionCount("lead_db_write_failed", since)

  const conversionRate =
    totalSessions > 0 ? (totalLeads / totalSessions) * 100 : 0
  const qualificationRate =
    totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0
  const formCompletionRate =
    formViews > 0 ? (formSuccesses / formViews) * 100 : 0

  return {
    kpis: {
      totalSessions,
      totalLeads,
      qualifiedLeads,
      conversionRate,
      qualificationRate,
      formCompletionRate,
    },
    leadsOverTime,
    byUtmSource,
    bySegmento,
    byFaturamento,
    byDevice,
    funnel,
    dropOffByField,
    submitErrors,
    leadDbWriteFailures,
    recentLeads,
  }
}
