import CtaButton from "@/components/ui/cta-button";
import { content } from "@/lib/content";

/** Pulsing green dot — CSS only, respects prefers-reduced-motion via motion-safe. */
function OnlineDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-cta opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-cta" />
    </span>
  );
}

export default function TeamCta() {
  const { sectionLabel, paragraph, cta, onlineIndicator } = content.teamCta;

  return (
    <section
      id="time-exclusivo"
      aria-label="Receba um time exclusivo"
      className="bg-brand-orange py-20 px-6"
    >
      <div className="max-w-3xl mx-auto text-center">

        {/* Section label */}
        <p className="text-white text-xs font-bold uppercase tracking-widest mb-5">
          {sectionLabel}
        </p>

        {/* Headline */}
        <h2 className="font-heading uppercase leading-tight text-3xl sm:text-4xl lg:text-5xl text-text-on-light mb-6">
          <span className="font-light">A </span>
          <span className="font-bold">ASSESSORIA ALPHA </span>
          <span className="font-light">
            ESTRUTURA O MARKETING DO SEU RESTAURANTE COM BASE NA SUA{" "}
          </span>
          <span className="font-bold">NECESSIDADE</span>
        </h2>

        {/* Body */}
        <p className="text-text-on-light/80 text-base sm:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          {paragraph}
        </p>

        {/* CTA + online indicator */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <CtaButton href="#formulario">{cta}</CtaButton>

          <span className="flex items-center gap-2 text-text-on-light font-semibold text-sm">
            <OnlineDot />
            {onlineIndicator}
          </span>
        </div>

      </div>
    </section>
  );
}
