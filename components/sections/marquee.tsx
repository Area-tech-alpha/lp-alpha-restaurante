import { content } from "@/lib/content";

/**
 * Cada item termina com o separador, então a junção entre as duas cópias
 * (span 1 → span 2 no loop) fica idêntica às junções internas — sem seam visível.
 */
function buildTrack(text: string, reps = 10) {
  return Array.from({ length: reps }, () => `${text}  ★  `).join("");
}

export default function Marquee() {
  const { text } = content.marquee;
  const track = buildTrack(text);

  return (
    /*
     * Margem negativa puxa as faixas para cima, sobrepondo o rodapé do Hero.
     * rotate-2 / -rotate-2 criam o efeito de "X" diagonal cruzado.
     */
    <div aria-hidden="true" className="relative -mt-20 z-20">
      {/* Faixa 1 — preta, inclinação positiva */}
      <div className="rotate-2 bg-text-on-light py-4 overflow-hidden w-[110vw] ml-[-5vw]">
        <div
          className="marquee-track flex whitespace-nowrap text-sm sm:text-base font-bold text-white tracking-widest uppercase"
          style={{ animation: "marquee 28s linear infinite reverse" }}
        >
          <span>{track}</span>
          <span aria-hidden="true">{track}</span>
        </div>
      </div>

      {/* Faixa 2 — branca, inclinação negativa (oposta à faixa 1) */}
      <div className="-rotate-2 bg-white py-4 overflow-hidden w-[110vw] ml-[-5vw]">
        <div
          className="marquee-track flex whitespace-nowrap text-sm sm:text-base font-bold tracking-widest uppercase"
          style={{ color: "#0A0A0A", animation: "marquee 38s linear infinite" }}
        >
          <span>{track}</span>
          <span aria-hidden="true">{track}</span>
        </div>
      </div>
    </div>
  );
}
