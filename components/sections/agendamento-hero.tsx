import Image from "next/image";
import LpCtaButton from "@/components/ui/lp-cta-button";
import { renderHeadline } from "@/components/sections/lp-hero";
import { content } from "@/lib/content";

const { hero } = content.agendamento;
const [featured, ...others] = hero.polaroids;

export default function AgendamentoHero({ headline }: { headline: string }) {
  return (
    <section
      id="hero"
      aria-label="Hero"
      data-section="hero"
      className="relative overflow-hidden bg-lp-hero-bg px-6 pt-8 pb-14 md:pt-10 md:pb-20"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_40%,rgba(255,183,3,0.16),transparent_55%)]"
      />

      <div className="relative z-10 mx-auto max-w-[1180px]">
        <a href="https://assessorialpha.com" className="mb-10 block w-fit max-md:mx-auto md:mb-14">
          <Image
            src="/logo-alpha-header.png"
            alt={content.hero.logoAlt}
            width={260}
            height={84}
            priority
            className="h-8 w-auto brightness-0 invert"
          />
        </a>

        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[1fr_1fr]">
          <div className="fade-in-load text-center md:text-left">
            <h1 className="font-lp-display text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.08] font-semibold text-lp-ink uppercase">
              {renderHeadline(headline)}
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-relaxed text-lp-text-muted md:mx-0">
              {hero.subtitle}
            </p>
            <LpCtaButton data-cta="hero-cta" className="mt-8">
              {hero.cta}
            </LpCtaButton>
          </div>

          <div className="mx-auto w-full max-w-[560px] lg:max-w-[600px]">
            <Image
              src={featured.src}
              alt={featured.alt}
              width={featured.width}
              height={featured.height}
              priority
              sizes="(min-width: 1024px) 600px, (min-width: 768px) 560px, 100vw"
              className="fade-in-load h-auto w-full [animation-delay:100ms]"
            />
            <div className="mt-4 grid grid-cols-2 items-start gap-4">
              {others.map((polaroid, i) => (
                <Image
                  key={polaroid.src}
                  src={polaroid.src}
                  alt={polaroid.alt}
                  width={polaroid.width}
                  height={polaroid.height}
                  sizes="(min-width: 1024px) 300px, (min-width: 768px) 280px, 50vw"
                  style={{ animationDelay: `${250 + i * 150}ms` }}
                  className="fade-in-load h-auto w-full"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
