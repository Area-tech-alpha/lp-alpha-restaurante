import type { DashboardData } from "@/lib/dashboard-queries"

type Props = { data: DashboardData["utmCampaigns"] }

function fmt(n: number) {
  return n.toLocaleString("pt-BR")
}

function pct(n: number) {
  return n.toFixed(1).replace(".", ",") + "%"
}

const HEADERS = [
  "Fonte",
  "Meio",
  "Campanha",
  "Conteúdo",
  "Termo",
  "Sessões",
  "Leads",
  "Qualificados",
  "Conversão",
  "Qualificação",
]

export default function UtmCampaignsTable({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-700">Campanhas (UTM detalhado)</h2>
        <p className="text-xs text-gray-400">
          Sessões e leads por combinação de utm_source / medium / campaign / content / term
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
                key={`${row.source}|${row.medium}|${row.campaign}|${row.content}|${row.term}`}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="py-2 pr-4 text-gray-900 whitespace-nowrap">{row.source}</td>
                <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{row.medium}</td>
                <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{row.campaign}</td>
                <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">{row.content}</td>
                <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">{row.term}</td>
                <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{fmt(row.sessions)}</td>
                <td className="py-2 pr-4 text-gray-900 font-medium whitespace-nowrap">{fmt(row.leads)}</td>
                <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{fmt(row.qualified)}</td>
                <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{pct(row.conversionRate)}</td>
                <td className="py-2 text-gray-600 whitespace-nowrap">{pct(row.qualificationRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
