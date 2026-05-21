import { content } from "@/lib/content";

const POLAROID_STYLES = [
  { transform: "rotate(-4deg) translateY(0px)", zIndex: 1, left: "0%" },
  { transform: "rotate(2deg) translateY(-12px)", zIndex: 3, left: "30%" },
  { transform: "rotate(-1.5deg) translateY(6px)", zIndex: 2, left: "58%" },
] as const;

export default function About() {
  const { sectionLabel, paragraphs, polaroids } = content.about;

  return (
    <section id="quem-somos" aria-label="Quem somos" className="bg-bg py-20 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">

        {/* Polaroids */}
        <div className="relative h-72 sm:h-80 lg:h-96 w-full max-w-md mx-auto lg:mx-0">
          {polaroids.map((photo, i) => (
            <div
              key={photo.label}
              aria-hidden={i > 0}
              className="absolute bg-white p-3 pb-10 shadow-2xl select-none"
              style={POLAROID_STYLES[i]}
            >
              {/* Tape */}
              <div
                aria-hidden="true"
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 rounded-sm"
                style={{ background: "rgba(255,255,255,0.55)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
              />
              {/* Photo placeholder */}
              <div className="w-40 h-40 sm:w-44 sm:h-44 bg-neutral-300 flex items-center justify-center">
                <span className="text-neutral-500 text-xs text-center px-2 font-medium">
                  {photo.alt}
                </span>
              </div>
              {/* Caption */}
              <p className="mt-3 text-neutral-800 text-center text-xs sm:text-sm font-bold tracking-widest uppercase">
                {photo.label}
              </p>
            </div>
          ))}
        </div>

        {/* Text */}
        <div>
          <p className="text-accent text-xs font-bold uppercase tracking-widest mb-4">
            {sectionLabel}
          </p>

          <h2 className="font-heading uppercase leading-tight text-3xl sm:text-4xl lg:text-[2.6rem] text-text mb-6">
            <span className="font-bold">LÍDER </span>
            <span className="font-light">EM </span>
            <span className="font-bold">MARKETING GASTRONÔMICO </span>
            <span className="font-light">E PARCEIRA DO </span>
            <span className="font-bold">SEU SUCESSO.</span>
          </h2>

          <div className="space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-text-muted leading-relaxed text-sm sm:text-base">
                {p}
              </p>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
