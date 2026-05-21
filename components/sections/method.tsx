import { content } from "@/lib/content";

/** Alpha double-arrow symbol as inline SVG — decorative. */
function AlphaSymbol() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 160"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="method-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFB800" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="arrow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFB800" />
          <stop offset="100%" stopColor="#F5A623" />
        </linearGradient>
      </defs>

      {/* Glow backdrop */}
      <circle cx="80" cy="80" r="78" fill="url(#method-glow)" />
      <circle cx="80" cy="80" r="60" fill="rgba(245,166,35,0.08)" />

      {/* Arrow 1 — top */}
      <path
        d="M40 50 L80 95 L120 50"
        stroke="url(#arrow-grad)"
        strokeWidth="11"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow 2 — bottom */}
      <path
        d="M40 80 L80 125 L120 80"
        stroke="url(#arrow-grad)"
        strokeWidth="11"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
    </svg>
  );
}

function MethodLabel({ children }: { children: string }) {
  return (
    <span className="text-text-muted text-xs sm:text-sm font-semibold uppercase tracking-wider bg-bg-card border border-white/10 rounded px-2 py-1 text-center whitespace-nowrap">
      {children}
    </span>
  );
}

export default function Method() {
  const { sectionLabel, subtitle, labels, badge } = content.method;

  return (
    <section id="metodo" aria-label="O Método Alpha" className="bg-bg py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">

        {/* Section label */}
        <p className="text-accent text-xs font-bold uppercase tracking-widest mb-5">
          {sectionLabel}
        </p>

        {/* Headline */}
        <h2 className="font-heading uppercase leading-tight text-3xl sm:text-4xl lg:text-5xl text-text mb-4 max-w-3xl mx-auto">
          <span className="font-light">EXISTE UM </span>
          <span className="font-bold">MÉTODO COMPROVADO </span>
          <span className="font-light">PARA QUE SEU RESTAURANTE </span>
          <span className="font-bold">NUNCA PARE </span>
          <span className="font-light">DE </span>
          <span className="font-bold">VENDER</span>
        </h2>

        {/* Subtitle */}
        <p className="text-text-muted text-base sm:text-lg mb-14 max-w-xl mx-auto">
          {subtitle}
        </p>

        {/* Visual — symbol + labels */}
        {/* TODO: substituir pelo vídeo .mp4 em loop quando disponível (lazy-load via IntersectionObserver) */}
        <div className="relative w-full max-w-sm mx-auto">
          {/* Top label row */}
          <div className="flex justify-center mb-4">
            <MethodLabel>{labels[0]}</MethodLabel>
          </div>

          {/* Middle row: label — symbol — label */}
          <div className="flex items-center justify-between gap-4">
            <MethodLabel>{labels[4]}</MethodLabel>

            {/* Symbol */}
            <div
              className="relative w-44 h-44 sm:w-52 sm:h-52 shrink-0 motion-safe:animate-pulse"
              style={{ animationDuration: "3s" }}
            >
              <AlphaSymbol />
            </div>

            <MethodLabel>{labels[1]}</MethodLabel>
          </div>

          {/* Bottom middle row: label — (gap) — label */}
          <div className="flex items-center justify-between gap-4 mt-4 px-2">
            <MethodLabel>{labels[3]}</MethodLabel>
            <div className="flex-1" />
            <MethodLabel>{labels[2]}</MethodLabel>
          </div>

          {/* Monetização badge */}
          <div className="flex justify-center mt-6">
            <span className="bg-accent text-text-on-light text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full">
              {badge}
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
