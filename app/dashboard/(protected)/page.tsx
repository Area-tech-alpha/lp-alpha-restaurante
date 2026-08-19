import { getDashboardData, type Range } from "@/lib/dashboard-queries"
import KpiCards from "@/components/dashboard/kpi-cards"
import DateRangeFilter from "@/components/dashboard/date-range-filter"
import LeadsOverTimeChart from "@/components/dashboard/leads-over-time-chart"
import LeadsByUtmChart from "@/components/dashboard/leads-by-utm-chart"
import LeadsBySegmentoChart from "@/components/dashboard/leads-by-segmento-chart"
import LeadsByFaturamentoChart from "@/components/dashboard/leads-by-faturamento-chart"
import LeadsByDeviceChart from "@/components/dashboard/leads-by-device-chart"
import FunnelChart from "@/components/dashboard/funnel-chart"
import DropOffByFieldChart from "@/components/dashboard/drop-off-by-field-chart"
import SubmitErrorsChart from "@/components/dashboard/submit-errors-chart"
import RecentLeadsTable from "@/components/dashboard/recent-leads-table"

export const dynamic = "force-dynamic"

const VALID_RANGES: Range[] = ["hoje", "7d", "30d", "90d", "all"]

function isRange(value: unknown): value is Range {
  return typeof value === "string" && VALID_RANGES.includes(value as Range)
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const params = await searchParams
  const range: Range = isRange(params.range) ? params.range : "30d"
  const data = await getDashboardData(range)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <DateRangeFilter current={range} />
      </div>

      <KpiCards kpis={data.kpis} leadDbWriteFailures={data.leadDbWriteFailures} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FunnelChart data={data.funnel} />
        <SubmitErrorsChart data={data.submitErrors} />
        <DropOffByFieldChart data={data.dropOffByField} />
        <LeadsOverTimeChart data={data.leadsOverTime} />
        <LeadsByUtmChart data={data.byUtmSource} />
        <LeadsBySegmentoChart data={data.bySegmento} />
        <LeadsByFaturamentoChart data={data.byFaturamento} />
        <LeadsByDeviceChart data={data.byDevice} />
      </div>

      <RecentLeadsTable leads={data.recentLeads} />
    </div>
  )
}
