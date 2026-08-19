import type { DashboardData } from "@/lib/dashboard-queries"

function fmt(n: number) {
  return n.toLocaleString("pt-BR")
}

function pct(n: number) {
  return n.toFixed(1).replace(".", ",") + "%"
}

type Kpis = DashboardData["kpis"]

// CSS-only (sem "use client"): abre no hover E no focus, então funciona por teclado.
function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        tabIndex={0}
        aria-label="O que é esse indicador?"
        className="w-3.5 h-3.5 shrink-0 rounded-full border border-gray-300 text-[9px] leading-[13px] text-gray-400 text-center cursor-help focus:outline-none focus:border-gray-500 focus:text-gray-600"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-lg bg-gray-900 px-3 py-2 text-[11px] leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 z-10"
      >
        {text}
      </span>
    </span>
  )
}

function Card({ label, value, tooltip }: { label: string; value: string; tooltip: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-1">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <InfoTooltip text={tooltip} />
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

export default function KpiCards({
  kpis,
  leadDbWriteFailures,
}: {
  kpis: Kpis
  leadDbWriteFailures: number
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card
          label="Sessões"
          value={fmt(kpis.totalSessions)}
          tooltip="Visitantes que iniciaram uma sessão na página, no período selecionado. Uma sessão nova é criada por navegador/dispositivo."
        />
        <Card
          label="Leads"
          value={fmt(kpis.totalLeads)}
          tooltip="Formulários enviados com sucesso e salvos no banco de dados, no período selecionado."
        />
        <Card
          label="Qualificados"
          value={fmt(kpis.qualifiedLeads)}
          tooltip="Leads cujo faturamento/interesse atende aos critérios de qualificação e foram roteados para uma página de obrigado qualificada."
        />
        <Card
          label="Taxa de Conversão"
          value={pct(kpis.conversionRate)}
          tooltip="Percentual de sessões que geraram um lead: Leads ÷ Sessões."
        />
        <Card
          label="Taxa de Qualificação"
          value={pct(kpis.qualificationRate)}
          tooltip="Percentual dos leads recebidos que foram qualificados: Qualificados ÷ Leads."
        />
        <Card
          label="Conclusão do Formulário"
          value={pct(kpis.formCompletionRate)}
          tooltip="Das sessões que viram o formulário, quantas concluíram o envio com sucesso: Enviou com sucesso ÷ Viu o formulário."
        />
      </div>

      {leadDbWriteFailures > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span aria-hidden="true">⚠️</span>
          <p>
            <strong>{fmt(leadDbWriteFailures)}</strong> lead(s) chegaram ao CRM/WhatsApp mas
            falharam ao salvar no banco do dashboard neste período — eles não aparecem nos
            KPIs, gráficos ou na tabela de leads recentes abaixo. Confira o CRM diretamente
            para esses casos.
          </p>
        </div>
      )}
    </div>
  )
}
