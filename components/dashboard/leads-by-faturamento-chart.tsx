"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { DashboardData } from "@/lib/dashboard-queries"

type Props = { data: DashboardData["byFaturamento"] }

// Short labels to fit the X axis
const SHORT_LABELS: Record<string, string> = {
  "Até 30 mil": "≤30k",
  "De 30 a 60 mil": "30-60k",
  "De 60 a 100 mil": "60-100k",
  "De 100 a 200 mil": "100-200k",
  "De 200 a 300 mil": "200-300k",
  "De 300 a 500 mil": "300-500k",
  "De 500 mil a 1 milhão": "500k-1M",
  "Acima de 1 milhão": ">1M",
}

export default function LeadsByFaturamentoChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    shortLabel: SHORT_LABELS[d.label] ?? d.label,
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">Leads por faturamento</h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">Sem dados no período</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="shortLabel"
              tick={{ fontSize: 10, fill: "#374151" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(v) => [Number(v), "Leads"]}
              labelFormatter={(l) => {
                const key = String(l)
                return data.find((d) => (SHORT_LABELS[d.label] ?? d.label) === key)?.label ?? key
              }}
            />
            <Bar dataKey="leads" fill="#374151" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
