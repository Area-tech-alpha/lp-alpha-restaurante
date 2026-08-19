"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { DashboardData } from "@/lib/dashboard-queries"

type Props = { data: DashboardData["submitErrors"] }

export default function SubmitErrorsChart({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">
        Por que o envio não foi concluído
      </h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">Sem falhas de envio no período</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis
              type="category"
              dataKey="reason"
              width={150}
              tick={{ fontSize: 11, fill: "#374151" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={(v) => [Number(v), "Ocorrências"]} />
            <Bar dataKey="count" fill="#d33" radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
