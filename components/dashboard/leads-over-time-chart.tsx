"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { DashboardData } from "@/lib/dashboard-queries"

type Props = { data: DashboardData["leadsOverTime"] }

function formatDay(iso: string) {
  const [, month, day] = iso.split("-")
  return `${day}/${month}`
}

export default function LeadsOverTimeChart({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">Leads por dia</h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">Sem dados no período</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="day"
              tickFormatter={formatDay}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
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
              labelFormatter={(l) => formatDay(String(l))}
            />
            <Line
              type="monotone"
              dataKey="leads"
              stroke="#111827"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
