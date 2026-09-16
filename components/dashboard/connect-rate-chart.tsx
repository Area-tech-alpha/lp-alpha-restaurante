"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { DashboardData } from "@/lib/dashboard-queries"

type Props = { data: DashboardData["connectRate"] }

const COLORS = ["#111827", "#374151", "#6b7280", "#9ca3af", "#d1d5db"]

function label(row: DashboardData["connectRate"]["byCampaign"][number]) {
  return row.campaignName ?? row.campaign
}

export default function ConnectRateChart({ data }: Props) {
  const chartData = data.byCampaign.map((row) => ({ ...row, label: label(row) }))
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          Connect Rate por campanha (sessões ÷ cliques no anúncio)
        </h2>
      </div>

      {data.byCampaign.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          Sem dados de cliques do Meta Ads no período — verifique a sincronização
          (app/api/cron/sync-meta-ads).
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              unit="%"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={110}
              tick={{ fontSize: 11, fill: "#374151" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value, _name, item) => {
                const row = item.payload as { sessions: number; clicks: number }
                return [
                  `${Number(value).toFixed(1)}% (${row.sessions} sessões / ${row.clicks} cliques)`,
                  "Connect Rate",
                ]
              }}
            />
            <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {data.unmatchedCampaigns > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {data.unmatchedCampaigns} campanha(s) com UTM na sessão não encontraram clique
          correspondente no Meta Ads — confira se o utm_campaign do anúncio usa o parâmetro
          dinâmico {"{{campaign.name}}"} exatamente.
        </p>
      )}
    </div>
  )
}
