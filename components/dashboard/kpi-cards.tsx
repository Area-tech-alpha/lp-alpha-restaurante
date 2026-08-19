import type { DashboardData } from "@/lib/dashboard-queries"

function fmt(n: number) {
  return n.toLocaleString("pt-BR")
}

function pct(n: number) {
  return n.toFixed(1).replace(".", ",") + "%"
}

type Kpis = DashboardData["kpis"]

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

export default function KpiCards({ kpis }: { kpis: Kpis }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card label="Sessões" value={fmt(kpis.totalSessions)} />
      <Card label="Leads" value={fmt(kpis.totalLeads)} />
      <Card label="Qualificados" value={fmt(kpis.qualifiedLeads)} />
      <Card label="Taxa de Conversão" value={pct(kpis.conversionRate)} />
      <Card label="Taxa de Qualificação" value={pct(kpis.qualificationRate)} />
      <Card label="Conclusão do Formulário" value={pct(kpis.formCompletionRate)} />
    </div>
  )
}
