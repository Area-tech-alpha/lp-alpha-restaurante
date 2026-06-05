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

type Props = { data: DashboardData["bySegmento"] }

export default function LeadsBySegmentoChart({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">Leads por segmento</h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">Sem dados no período</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#374151" }}
              tickLine={false}
              axisLine={false}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={(v) => [Number(v), "Leads"]} />
            <Bar dataKey="leads" fill="#111827" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
