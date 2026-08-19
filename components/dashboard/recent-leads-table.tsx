import type { DashboardData } from "@/lib/dashboard-queries"

type Props = { leads: DashboardData["recentLeads"] }

function formatDate(iso: string) {
  // O banco salva em UTC; sem timeZone explícito o Node formata no fuso do
  // servidor (UTC na Vercel), mostrando o horário 3h adiantado em relação a Brasília.
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

export default function RecentLeadsTable({ leads }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">
        Leads recentes{" "}
        <span className="text-gray-400 font-normal">({leads.length})</span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Nome", "E-mail", "Empresa", "Segmento", "Qualificado", "Fonte", "Data"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-2 pr-4 whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                  Sem leads no período
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-2 pr-4 text-gray-900 whitespace-nowrap">{lead.nome}</td>
                <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{lead.email}</td>
                <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{lead.empresa}</td>
                <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{lead.segmento}</td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      lead.qualified
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {lead.qualified ? "Sim" : "Não"}
                  </span>
                </td>
                <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">
                  {lead.utmSource ?? "(direto)"}
                </td>
                <td className="py-2 text-gray-400 whitespace-nowrap text-xs">
                  {formatDate(lead.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
