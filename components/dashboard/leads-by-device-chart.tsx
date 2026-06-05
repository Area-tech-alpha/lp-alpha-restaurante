"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { DashboardData } from "@/lib/dashboard-queries"

type Props = { data: DashboardData["byDevice"] }

const COLORS = ["#111827", "#6b7280", "#d1d5db"]
const LABELS: Record<string, string> = {
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop",
  desconhecido: "Desconhecido",
}

export default function LeadsByDeviceChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: LABELS[d.label] ?? d.label,
    value: d.leads,
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">Leads por dispositivo</h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">Sem dados no período</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [Number(v), "Leads"]} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: 12, color: "#374151" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
