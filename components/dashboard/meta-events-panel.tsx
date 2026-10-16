import type { BrowserStatus, MetaEventsData, ServerLog } from "@/lib/meta-events-queries"

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

type Tone = "ok" | "warn" | "bad" | "muted"

const TONE: Record<Tone, string> = {
  ok: "bg-green-50 text-green-700 border-green-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
  bad: "bg-red-50 text-red-700 border-red-200",
  muted: "bg-gray-50 text-gray-500 border-gray-200",
}

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-block rounded-md border px-1.5 py-0.5 text-xs whitespace-nowrap ${TONE[tone]}`}>
      {children}
    </span>
  )
}

function ServerCell({ log }: { log: ServerLog | null }) {
  if (!log) return <Badge tone="muted">sem registro</Badge>
  switch (log.status) {
    case "sent":
      return log.testEventCode ? (
        <Badge tone="warn">Recebido em modo TESTE ({log.testEventCode})</Badge>
      ) : (
        <Badge tone="ok">Recebido ({log.eventsReceived ?? "?"})</Badge>
      )
    case "error":
      return (
        <div className="space-y-1">
          <Badge tone="bad">Erro {log.httpStatus ?? "de rede"}</Badge>
          {log.error && <p className="text-xs text-red-600 break-all">{log.error}</p>}
          {log.token && (
            <p className="text-xs text-gray-500">
              Token: {log.token.source}, {log.token.length} caracteres,{" "}
              {log.token.startsWithEAA ? "começa com EAA" : "NÃO começa com EAA"}
              {log.token.wasSanitized && ", tinha espaço/aspas (limpo automaticamente)"}
            </p>
          )}
        </div>
      )
    case "no_token":
      return <Badge tone="bad">Sem token CAPI</Badge>
    case "no_event_id":
      return <Badge tone="bad">Sem eventId</Badge>
    case "not_qualified":
      return <Badge tone="muted">Não enviado (não qualificado)</Badge>
  }
}

function BrowserCell({ status, qualified }: { status: BrowserStatus | null; qualified: boolean }) {
  if (!qualified) return <Badge tone="muted">—</Badge>
  switch (status) {
    case "sent":
      return <Badge tone="ok">Disparado</Badge>
    case "script_not_loaded":
      return <Badge tone="warn">Script bloqueado</Badge>
    case "fbq_missing":
      return <Badge tone="bad">fbq ausente</Badge>
    default:
      return <Badge tone="muted">sem registro</Badge>
  }
}

function Stat({ label, value, tone, hint }: { label: string; value: number; tone?: Tone; hint: string }) {
  const color =
    tone === "ok" ? "text-green-700" : tone === "warn" ? "text-amber-700" : tone === "bad" ? "text-red-700" : "text-gray-900"
  return (
    <div className="rounded-lg border border-gray-100 p-3" title={hint}>
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}

const th = "text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-2 pr-4 whitespace-nowrap"

export default function MetaEventsPanel({ data }: { data: MetaEventsData }) {
  const { summary: s, rows } = data

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-700">Eventos Meta — Lead (pixel 348950488264714)</h2>
        <p className="text-xs text-gray-400 mt-1">
          Conciliação lead a lead do que foi enviado ao Meta. Resumo considera só leads qualificados
          criados depois que o log passou a existir.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <Stat label="Qualificados" value={s.qualifiedLeads} hint="Leads qualificados com log de envio" />
        <Stat
          label="CAPI recebido"
          value={s.serverReceived}
          tone="ok"
          hint="Meta respondeu 200 com events_received pela API de Conversões"
        />
        <Stat
          label="CAPI em teste"
          value={s.serverReceivedTestMode}
          tone={s.serverReceivedTestMode ? "warn" : undefined}
          hint="Enviado com META_CAPI_TEST_EVENT_CODE — só aparece em 'Testar eventos', não conta para anúncios"
        />
        <Stat
          label="CAPI erro"
          value={s.serverFailed}
          tone={s.serverFailed ? "bad" : undefined}
          hint="Meta respondeu erro ou falha de rede"
        />
        <Stat
          label="CAPI sem token"
          value={s.serverNoToken}
          tone={s.serverNoToken ? "bad" : undefined}
          hint="META_CAPI_TOKEN não configurado na Vercel"
        />
        <Stat
          label="Pixel disparado"
          value={s.browserSent}
          tone="ok"
          hint="fbevents.js estava carregado quando o fbq('track','Lead') foi chamado"
        />
        <Stat
          label="Pixel bloqueado"
          value={s.browserBlocked}
          tone={s.browserBlocked ? "warn" : undefined}
          hint="Script do Meta não carregou (adblock, navegador do Instagram, rede) — só a CAPI cobre esses"
        />
        <Stat
          label="Com fbc (clique)"
          value={s.withFbc}
          hint="Lead tinha cookie _fbc (veio de clique em anúncio). Sem ele a atribuição ao anúncio fica mais fraca"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className={th}>Quando</th>
              <th className={th}>Lead</th>
              <th className={th}>Qualificado</th>
              <th className={th}>Servidor (CAPI)</th>
              <th className={th}>Navegador (pixel)</th>
              <th className={th}>fbp / fbc</th>
              <th className={th}>fbtrace_id</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.leadId} className="border-b border-gray-50 align-top">
                <td className="py-2 pr-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(r.createdAt)}</td>
                <td className="py-2 pr-4">
                  <p className="text-gray-900">{r.nome}</p>
                  <p className="text-xs text-gray-400">{r.empresa}</p>
                </td>
                <td className="py-2 pr-4">
                  {r.qualified ? <Badge tone="ok">Sim</Badge> : <Badge tone="muted">Não</Badge>}
                </td>
                <td className="py-2 pr-4">
                  <ServerCell log={r.server} />
                </td>
                <td className="py-2 pr-4">
                  <BrowserCell status={r.browser} qualified={r.qualified} />
                </td>
                <td className="py-2 pr-4 text-xs text-gray-500 whitespace-nowrap">
                  {r.server && r.server.status !== "not_qualified"
                    ? `${r.server.hasFbp ? "✓" : "✗"} / ${r.server.hasFbc ? "✓" : "✗"}`
                    : "—"}
                </td>
                <td className="py-2 text-xs text-gray-400 font-mono break-all">{r.server?.fbtraceId ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
