import type { ConversionGroup, VideoData } from "@/lib/video-queries"

function fmt(n: number) {
  return n.toLocaleString("pt-BR")
}

function pct(n: number) {
  return n.toFixed(1).replace(".", ",") + "%"
}

function duration(sec: number | null) {
  if (sec === null) return "—"
  const s = Math.round(sec)
  return s >= 60 ? `${Math.floor(s / 60)}min ${String(s % 60).padStart(2, "0")}s` : `${s}s`
}

function GroupCard({
  label,
  hint,
  group,
  highlight,
}: {
  label: string
  hint: string
  group: ConversionGroup
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-4 space-y-1 ${
        highlight ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-gray-50"
      }`}
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{pct(group.conversionRate)}</p>
      <p className="text-xs text-gray-500">
        {fmt(group.converted)} leads de {fmt(group.sessions)} sessões · {pct(group.qualifiedRate)}{" "}
        qualificados
      </p>
      <p className="text-[11px] text-gray-400">{hint}</p>
    </div>
  )
}

function Retention({ value, base }: { value: number; base: number }) {
  const share = base > 0 ? (value / base) * 100 : 0
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="h-1.5 w-12 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, share)}%` }} />
      </div>
      <span className="text-gray-600 tabular-nums">{base > 0 ? pct(share) : "—"}</span>
    </div>
  )
}

const TH =
  "text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-2 pr-4 whitespace-nowrap"

export default function VideosPanel({ data }: { data: VideoData }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-700">Vídeos de depoimento</h2>
        <p className="text-xs text-gray-400">
          {fmt(data.playedAny)} de {fmt(data.sawSection)} sessões que chegaram aos depoimentos deram
          play ({pct(data.playRate)}). Progresso conta tempo realmente assistido — pular para o fim
          não conta.
        </p>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <GroupCard
            label="Assistiram"
            hint="Deram play em pelo menos um depoimento"
            group={data.watched}
            highlight
          />
          <GroupCard
            label="Viram, não assistiram"
            hint="Chegaram na seção de depoimentos sem dar play"
            group={data.sawNotWatched}
          />
          <GroupCard
            label="Não chegaram na seção"
            hint="Saíram ou converteram antes dos depoimentos"
            group={data.didNotSee}
          />
        </div>
        <p className="text-[11px] text-gray-400">
          Conversão = sessões com lead ÷ sessões do grupo. É correlação, não causa: quem dá play já
          tende a ser um visitante mais interessado.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Vídeo", "Plays", "25%", "50%", "75%", "Até o fim", "Tempo médio"].map((h) => (
                <th key={h} className={TH}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.videos.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                  Nenhum play no período
                </td>
              </tr>
            )}
            {data.videos.map((v) => (
              <tr key={v.videoId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-2 pr-4 font-medium text-gray-800 whitespace-nowrap">
                  <a
                    href={`https://www.youtube.com/watch?v=${v.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {v.label}
                  </a>
                </td>
                <td className="py-2 pr-4 text-gray-600 tabular-nums">{fmt(v.plays)}</td>
                <td className="py-2 pr-4">
                  <Retention value={v.p25} base={v.plays} />
                </td>
                <td className="py-2 pr-4">
                  <Retention value={v.p50} base={v.plays} />
                </td>
                <td className="py-2 pr-4">
                  <Retention value={v.p75} base={v.plays} />
                </td>
                <td className="py-2 pr-4">
                  <Retention value={v.completes} base={v.plays} />
                </td>
                <td className="py-2 pr-4 text-gray-600 tabular-nums">{duration(v.avgSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Variação", "Sessões", "Taxa de play", "Conversão (assistiu)", "Conversão (viu, não assistiu)"].map(
                (h) => (
                  <th key={h} className={TH}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {data.byVariant.map((r) => (
              <tr key={r.variant} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-2 pr-4 font-medium text-gray-800">{r.variant}</td>
                <td className="py-2 pr-4 text-gray-600 tabular-nums">{fmt(r.sessions)}</td>
                <td className="py-2 pr-4 text-gray-600 tabular-nums">{pct(r.playRate)}</td>
                <td className="py-2 pr-4 text-gray-600 tabular-nums">{pct(r.watchedConversion)}</td>
                <td className="py-2 pr-4 text-gray-600 tabular-nums">{pct(r.notWatchedConversion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
