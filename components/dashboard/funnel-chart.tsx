import type { DashboardData } from "@/lib/dashboard-queries"

type Props = { data: DashboardData["funnel"] }

export default function FunnelChart({ data }: Props) {
  const max = data[0]?.count ?? 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">Funil do formulário</h2>
      {max === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">Sem dados no período</p>
      ) : (
        <div className="space-y-3 py-1">
          {data.map((stage, i) => {
            const width = max > 0 ? Math.max((stage.count / max) * 100, stage.count > 0 ? 4 : 0) : 0
            const prev = i > 0 ? data[i - 1].count : null
            const dropFromPrev =
              prev && prev > 0 ? ((prev - stage.count) / prev) * 100 : null

            return (
              <div key={stage.stage}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">{stage.stage}</span>
                  <span className="text-xs text-gray-500">
                    {stage.count.toLocaleString("pt-BR")}
                    {dropFromPrev !== null && dropFromPrev > 0 && (
                      <span className="text-[#d33] ml-1.5">-{dropFromPrev.toFixed(0)}%</span>
                    )}
                  </span>
                </div>
                <div className="h-6 bg-gray-100 rounded-md overflow-hidden">
                  <div
                    className="h-full bg-gray-900 rounded-md transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
