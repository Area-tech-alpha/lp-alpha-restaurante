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

type Props = { data: DashboardData["byUtmSource"] }

const COLORS = ["#111827", "#374151", "#6b7280", "#9ca3af", "#d1d5db"]

export default function LeadsByUtmChart({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">Leads por fonte (UTM source)</h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">Sem dados no período</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={80}
              tick={{ fontSize: 11, fill: "#374151" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={(v) => [Number(v), "Leads"]} />
            <Bar dataKey="leads" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
