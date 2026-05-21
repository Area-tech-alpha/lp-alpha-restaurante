import { content } from "@/lib/content";

/** Repete o texto 8× para garantir loop contínuo sem gaps visíveis. */
function buildTrack(text: string, reps = 8) {
  return Array.from({ length: reps }, () => text).join("  ");
}

export default function Marquee() {
  const { text } = content.marquee;
  const track = buildTrack(text);

  return (
    /*
     * Posicionamento: margem negativa puxa a faixa para cima, sobrepondo o rodapé
     * do Hero — efeito visual de "borda diagonal cruzando o hero".
     */
    <div aria-hidden="true" className="relative -mt-10 z-20 overflow-hidden">
      {/* Faixa 1 — preta, rotação leve */}
      <div className="-rotate-2 bg-text-on-light py-3 overflow-hidden">
        <div
          className="marquee-track flex gap-12 whitespace-nowrap text-sm sm:text-base font-bold text-white tracking-widest uppercase"
          style={{ animation: "marquee 28s linear infinite" }}
        >
          <span>{track}</span>
          {/* Cópia idêntica para loop perfeito */}
          <span aria-hidden="true">{track}</span>
        </div>
      </div>

      {/* Faixa 2 — cinza-escuro, ângulo e velocidade ligeiramente diferentes */}
      <div className="-rotate-1 bg-[#1a1a1a] py-3 overflow-hidden mt-1">
        <div
          className="marquee-track flex gap-12 whitespace-nowrap text-sm sm:text-base font-semibold text-text-muted tracking-widest uppercase"
          style={{ animation: "marquee 38s linear infinite reverse" }}
        >
          <span>{track}</span>
          <span aria-hidden="true">{track}</span>
        </div>
      </div>
    </div>
  );
}
