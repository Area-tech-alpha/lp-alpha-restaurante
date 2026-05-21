import Image from "next/image";
import CtaButton from "@/components/ui/cta-button";
import { content } from "@/lib/content";

/** SVG data-URI chevron pattern — decorative background texture. */
const CHEVRON_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath d='M8 6 L24 24 L8 42' stroke='rgba(0,0,0,0.13)' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M24 6 L40 24 L24 42' stroke='rgba(0,0,0,0.13)' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";

export default function Hero() {
  const { headline, subtitle, cta } = content.hero;

  return (
    <section
      id="hero"
      aria-label="Hero"
      className="relative bg-brand-orange overflow-hidden flex flex-col items-center pb-16"
    >
      {/* Chevron texture — decorative */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: CHEVRON_BG, backgroundSize: "48px 48px" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-14 pb-20 max-w-5xl mx-auto w-full">
        {/* Logo */}
        <Image
          src="/logo-alpha.svg"
          alt="Alpha Assessoria"
          width={200}
          height={52}
          priority
          className="mb-10"
        />

        {/* Headline — Anton display font, UPPERCASE, mix de pesos */}
        <h1 className="font-display leading-none uppercase text-text-on-light">
          {/* Linha 1 — peso normal (Anton só tem 400, então usamos tamanho menor) */}
          <span className="block text-3xl sm:text-4xl md:text-5xl font-normal tracking-wide">
            {headline.line1}
          </span>
          {/* Linhas 2-4 — destaque em maior escala */}
          <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal mt-2 leading-tight">
            {headline.line2}
          </span>
          <span className="inline text-3xl sm:text-4xl md:text-5xl font-normal">
            {headline.line3}{" "}
          </span>
          <span className="inline text-3xl sm:text-4xl md:text-5xl font-normal">
            {headline.line4}
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="mt-6 text-lg sm:text-xl text-text-on-light font-semibold max-w-xl">
          {subtitle}
        </p>

        {/* CTA */}
        <div className="mt-8">
          <CtaButton href="#formulario">{cta}</CtaButton>
        </div>
      </div>
    </section>
  );
}
