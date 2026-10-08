import type { DashboardData } from "@/lib/dashboard-queries"

type Props = {
  groups: DashboardData["submitErrorGroups"]
  recent: DashboardData["recentSubmitErrors"]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

const th = "text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-2 pr-4 whitespace-nowrap"
const NO_MESSAGE = "não registrada (evento antigo)"

export default function SubmitErrorsDetail({ groups, recent }: Props) {
  if (groups.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-6">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Detalhe dos erros de envio, por campo e mensagem
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className={th}>Campo</th>
                <th className={th}>Mensagem exibida ao visitante</th>
                <th className={th}>Ocorrências</th>
                <th className={th}>Exemplos digitados</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => (
                <tr key={i} className="border-b border-gray-50 align-top">
                  <td className="py-2 pr-4 text-gray-900 whitespace-nowrap">{g.field}</td>
                  <td className="py-2 pr-4 text-gray-600">
                    {g.message ?? <span className="text-gray-400">{NO_MESSAGE}</span>}
                  </td>
                  <td className="py-2 pr-4 text-gray-900 tabular-nums">{g.count}</td>
                  <td className="py-2 text-gray-500 font-mono text-xs break-all">
                    {g.samples.length ? g.samples.map((s) => `"${s}"`).join("  ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Últimas ocorrências</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className={th}>Quando</th>
                <th className={th}>Campo</th>
                <th className={th}>Valor digitado</th>
                <th className={th}>Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 align-top">
                  <td className="py-2 pr-4 text-gray-400 text-xs whitespace-nowrap">
                    {formatDate(r.ts)}
                  </td>
                  <td className="py-2 pr-4 text-gray-900 whitespace-nowrap">{r.field}</td>
                  <td className="py-2 pr-4 text-gray-500 font-mono text-xs break-all">
                    {r.value ? `"${r.value}"` : "—"}
                  </td>
                  <td className="py-2 text-gray-600">
                    {r.message ?? <span className="text-gray-400">{NO_MESSAGE}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
