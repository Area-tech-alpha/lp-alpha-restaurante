import { content } from "@/lib/content";

export default function Method() {
  const { sectionLabel, subtitle, labels, badge } = content.method;

  const gold = "#F5A623";
  const labelProps = {
    fill: "#F5F5F5",
    fillOpacity: 0.9,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.8,
  } as const;

  return (
    <section id="metodo" aria-label="O Método Alpha" className="bg-black py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">

        <p className="text-accent text-xs font-bold uppercase tracking-widest mb-5">
          {sectionLabel}
        </p>

        <h2 className="font-heading uppercase leading-tight text-3xl sm:text-4xl lg:text-5xl text-text mb-4 max-w-3xl mx-auto">
          <span className="font-light">EXISTE UM </span>
          <span className="font-bold">MÉTODO COMPROVADO </span>
          <span className="font-light">PARA QUE SEU RESTAURANTE </span>
          <span className="font-bold">NUNCA PARE </span>
          <span className="font-light">DE </span>
          <span className="font-bold">VENDER</span>
        </h2>

        <p className="text-text-muted text-base sm:text-lg mb-14 max-w-xl mx-auto">
          {subtitle}
        </p>

        <svg
          viewBox="0 0 900 820"
          className="w-full max-w-225 mx-auto"
          role="img"
          aria-label="Diagrama circular do Método Alpha"
        >
          <defs>
            {/* Glow for the badge */}
            <filter id="badge-glow" x="-30%" y="-80%" width="160%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Float animation for the badge */}
          <style>{`
            @keyframes badgeFloat {
              0%, 100% { transform: translateY(0px); }
              50%       { transform: translateY(-9px); }
            }
            .badge-float { animation: badgeFloat 2.8s ease-in-out infinite; }
          `}</style>

          {/* ── Connector lines ── */}

          <line x1="450" y1="230" x2="450" y2="140" stroke={gold} strokeWidth="1" strokeOpacity="0.6" />
          <circle cx="450" cy="140" r="3" fill={gold} />

          <line x1="620" y1="270" x2="700" y2="185" stroke={gold} strokeWidth="1" strokeOpacity="0.6" />
          <circle cx="700" cy="185" r="3" fill={gold} />

          <line x1="620" y1="510" x2="700" y2="595" stroke={gold} strokeWidth="1" strokeOpacity="0.6" />
          <circle cx="700" cy="595" r="3" fill={gold} />

          <line x1="280" y1="510" x2="200" y2="595" stroke={gold} strokeWidth="1" strokeOpacity="0.6" />
          <circle cx="200" cy="595" r="3" fill={gold} />

          <line x1="280" y1="270" x2="200" y2="185" stroke={gold} strokeWidth="1" strokeOpacity="0.6" />
          <circle cx="200" cy="185" r="3" fill={gold} />

          {/* ── Labels ── */}

          <text x="450" y="126" textAnchor="middle" {...labelProps}>
            {labels[0].toUpperCase()}
          </text>
          <text x="710" y="189" textAnchor="start" {...labelProps}>
            {labels[1].toUpperCase()}
          </text>
          <text x="710" y="599" textAnchor="start" {...labelProps}>
            {labels[2].toUpperCase()}
          </text>
          <text x="190" y="599" textAnchor="end" {...labelProps}>
            {labels[3].toUpperCase()}
          </text>
          <text x="190" y="189" textAnchor="end" {...labelProps}>
            {labels[4].toUpperCase()}
          </text>

          {/* ── Monetização badge (floating) ── */}
          {/* Badge rect: x=320 width=260 → spans 320–580, center x=450, center y=744 */}
          <g className="badge-float" filter="url(#badge-glow)">
            <rect x="320" y="718" width="260" height="52" rx="14" fill={gold} />

            {/* Coin icon — two concentric circles + vertical line */}
            <circle cx="349" cy="744" r="14" fill="rgba(0,0,0,0.2)" />
            <circle cx="349" cy="744" r="10" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
            <line x1="349" y1="737" x2="349" y2="751" stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" />

            {/* Text centered in space right of coin */}
            <text
              x="468"
              y="744"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#0A0A0A"
              fontSize="13"
              fontWeight="800"
              letterSpacing="2"
            >
              {badge.toUpperCase()}
            </text>
          </g>

          {/* ── Central video (600×600) ── */}
          <foreignObject x="150" y="90" width="600" height="600">
            {/* @ts-expect-error — xmlns required by SVG spec for foreignObject children */}
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: "100%", height: "100%" }}>
              <video
                autoPlay
                muted
                loop
                playsInline
                width={600}
                height={600}
                style={{ width: "100%", height: "100%", display: "block" }}
              >
                <source src="/video/639e209b-65e1-4163-adc5-2a20e5b00d84-video.webm" type="video/webm" />
                <source src="/video/639e209b-65e1-4163-adc5-2a20e5b00d84-video.mp4" type="video/mp4" />
              </video>
            </div>
          </foreignObject>
        </svg>

      </div>
    </section>
  );
}
