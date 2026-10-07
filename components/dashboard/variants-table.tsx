import type { DashboardData } from "@/lib/dashboard-queries"

type Props = { data: DashboardData["byVariant"] }

const HEADERS = ["Variação", "Sessões", "Leads", "Qualificados", "Conversão"]

function pct(n: number) {
  return n.toFixed(1).replace(".", ",") + "%"
}

export default function VariantsTable({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-700">Variações da LP</h2>
        <p className="text-xs text-gray-400">
          Sessões e leads por página de entrada (home e /lp-01 a /lp-08)
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-2 pr-4 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={HEADERS.length} className="py-8 text-center text-gray-400 text-sm">
                  Sem dados no período
                </td>
              </tr>
            )}
            {data.map((row) => (
              <tr
                key={row.variant}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="py-2 pr-4 font-medium text-gray-800">{row.variant}</td>
                <td className="py-2 pr-4 text-gray-600">{row.sessions.toLocaleString("pt-BR")}</td>
                <td className="py-2 pr-4 text-gray-600">{row.leads.toLocaleString("pt-BR")}</td>
                <td className="py-2 pr-4 text-gray-600">
                  {row.qualified.toLocaleString("pt-BR")}
                </td>
                <td className="py-2 pr-4 text-gray-600">{pct(row.conversionRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
