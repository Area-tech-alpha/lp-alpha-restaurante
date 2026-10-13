import type { ClarityData, ClarityRow } from "@/lib/clarity-queries"

const CLARITY_URL = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID
  ? `https://clarity.microsoft.com/projects/view/${process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}/dashboard`
  : "https://clarity.microsoft.com"

// Abaixo disso a % oscila demais para valer destaque.
const MIN_SESSIONS_TO_FLAG = 20
const FLAG_RATIO = 1.5

type FrustrationCol = "deadClick" | "rageClick" | "quickback" | "excessiveScroll" | "scriptError"

const FRUSTRATION_COLS: { key: FrustrationCol; label: string; tip: string }[] = [
  { key: "rageClick", label: "Rage click", tip: "Cliques repetidos e rápidos no mesmo lugar — frustração" },
  { key: "deadClick", label: "Dead click", tip: "Clique em algo que não responde" },
  { key: "quickback", label: "Quickback", tip: "Saiu da página e voltou logo em seguida" },
  { key: "excessiveScroll", label: "Scroll excessivo", tip: "Rolou para cima e para baixo procurando algo" },
  { key: "scriptError", label: "Erro JS", tip: "Sessões com erro de JavaScript" },
]

function fmt(n: number) {
  return Math.round(n).toLocaleString("pt-BR")
}

function pct(n: number | null) {
  return n === null ? "—" : n.toFixed(1).replace(".", ",") + "%"
}

function seconds(n: number | null) {
  if (n === null) return "—"
  const s = Math.round(n)
  return s >= 60 ? `${Math.floor(s / 60)}min ${String(s % 60).padStart(2, "0")}s` : `${s}s`
}

function formatDay(iso: string) {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function Table({ rows, baseline }: { rows: ClarityRow[]; baseline?: Map<string, ClarityRow> }) {
  const headers = ["Variação", "Dispositivo", "Sessões", "Scroll médio", "Tempo ativo"]
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-2 pr-4 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
            {FRUSTRATION_COLS.map((c) => (
              <th
                key={c.key}
                title={c.tip}
                className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-2 pr-4 whitespace-nowrap cursor-help"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const base = baseline?.get(r.device)
            return (
              <tr
                key={`${r.variant}|${r.device}`}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="py-2 pr-4 font-medium text-gray-800 whitespace-nowrap">{r.variant}</td>
                <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{r.device}</td>
                <td className="py-2 pr-4 text-gray-600 tabular-nums">{fmt(r.sessions)}</td>
                <td className="py-2 pr-4 text-gray-600 tabular-nums">{pct(r.scrollDepth)}</td>
                <td className="py-2 pr-4 text-gray-600 tabular-nums">{seconds(r.activeTimeSec)}</td>
                {FRUSTRATION_COLS.map((c) => {
                  const value = r[c.key]
                  const ref = base?.[c.key] ?? null
                  const flagged =
                    value !== null &&
                    ref !== null &&
                    ref > 0 &&
                    r.sessions >= MIN_SESSIONS_TO_FLAG &&
                    value >= ref * FLAG_RATIO
                  return (
                    <td key={c.key} className="py-2 pr-4 tabular-nums">
                      <span
                        className={
                          flagged
                            ? "inline-block rounded px-1.5 py-0.5 bg-amber-100 text-amber-900 font-medium"
                            : "text-gray-600"
                        }
                        title={flagged ? `${FLAG_RATIO}× acima da média de ${r.device}` : undefined}
                      >
                        {pct(value)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function ClarityPanel({ data }: { data: ClarityData }) {
  const baseline = new Map(data.byDevice.map((r) => [r.device, r]))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Experiência na página (Clarity)</h2>
          <p className="text-xs text-gray-400">
            {data.days > 0 && data.firstDate && data.lastDate
              ? `${data.days} dia(s) sincronizado(s), de ${formatDay(data.firstDate)} a ${formatDay(data.lastDate)}. `
              : ""}
            % de sessões com cada sinal de atrito. Em destaque: variação {FLAG_RATIO}× acima da média
            do dispositivo — vale abrir as gravações dela no Clarity.
          </p>
        </div>
        <a
          href={CLARITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
        >
          Abrir no Clarity ↗
        </a>
      </div>

      {data.days === 0 ? (
        <p className="py-6 text-center text-gray-400 text-sm">
          Sem dados do Clarity no período. O sync roda 1x por dia (00:05 de Brasília) e traz o dia
          anterior — o dia de hoje só aparece amanhã.
        </p>
      ) : (
        <>
          <Table rows={data.byDevice} />
          <Table rows={data.byVariant} baseline={baseline} />
          {data.truncated && (
            <p className="text-[11px] text-amber-700">
              A API do Clarity devolveu o máximo de 1.000 linhas em algum dia: a quebra por
              variação pode estar incompleta. Os totais por dispositivo acima não são afetados.
            </p>
          )}
        </>
      )}
    </div>
  )
}
