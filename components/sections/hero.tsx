import Image from "next/image";
import CtaButton from "@/components/ui/cta-button";
import { content } from "@/lib/content";

export default function Hero() {
  const { headline, subtitle, cta } = content.hero;

  return (
    <section
      id="hero"
      aria-label="Hero"
      className="relative overflow-hidden flex flex-col items-center pb-16"
    >
      {/* Background image */}
      <Image
        src="/hero-nova-teste-home.webp"
        alt=""
        fill
        priority
        className="object-cover object-center"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-14 pb-20 max-w-5xl mx-auto w-full">
        {/* Logo */}
        <Image
          src="/Logo-Alpha.png.webp"
          alt="Alpha Assessoria"
          width={200}
          height={52}
          priority
          className="mb-10"
        />

        <h1 className="leading-none uppercase text-text-on-light">
          {/* Linha 1 — Oswald fino para contraste com o bloco bold abaixo */}
          <span className="block font-heading font-light text-xl sm:text-2xl md:text-3xl tracking-widest mb-2">
            {headline.line1}
          </span>
          {/* Linha 2 — Anton grande, destaque principal */}
          <span className="block font-display text-3xl sm:text-5xl md:text-6xl leading-tight">
            {headline.line2}
          </span>
          {/* Linhas 3-4 — Anton, mesmo peso mas ligeiramente menor */}
          <span className="font-display text-2xl sm:text-4xl md:text-5xl">
            {headline.line3}{" "}
          </span>
          <span className="font-display text-2xl sm:text-4xl md:text-5xl">
            {headline.line4}
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="mt-5 text-sm sm:text-base text-text-on-light/90 max-w-sm">
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
