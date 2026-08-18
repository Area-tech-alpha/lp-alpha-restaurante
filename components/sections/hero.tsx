import Image from "next/image";
import LeadForm from "@/components/lead-form";
import LpCtaButton from "@/components/ui/lp-cta-button";
import ScrollFade from "@/components/ui/scroll-fade";
import { content } from "@/lib/content";

const { hero } = content;

export default function Hero() {
  return (
    <section
      id="hero"
      aria-label="Hero"
      data-section="hero"
      className="relative overflow-hidden px-3 pt-6 pb-10 sm:px-4 sm:pt-9 sm:pb-[60px]"
    >
      <Image
        src="/hero-nova-00-lp.webp"
        alt=""
        fill
        priority
        className="object-cover object-center"
      />

      <div className="relative z-10 mx-auto max-w-[1160px]">
        <div className="rounded-[32px] bg-lp-white p-5 shadow-[0_50px_110px_-30px_rgba(20,16,5,0.45)] sm:p-6 md:p-9">
          <div className="mb-5 flex items-center justify-center md:justify-start">
            <a href="https://assessorialpha.com">
              <Image
                src="/logo-alpha-header.png"
                alt={hero.logoAlt}
                width={750}
                height={242}
                priority
                className="h-7 w-auto"
              />
            </a>
          </div>

          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1.05fr_.95fr]">
            <div>
              <ScrollFade delay={80}>
                <h1 className="font-lp-display text-[clamp(2rem,4.4vw,3.1rem)] leading-[1.12] font-semibold text-lp-ink mb-4">
                  {hero.headlinePrefix}
                  <span className="lp-gold-text">{hero.headlineHighlight1}</span>
                  {hero.headlineMiddle}
                  <span className="lp-gold-text">{hero.headlineHighlight2}</span>
                  {hero.headlineSuffix}
                </h1>
              </ScrollFade>

              <ScrollFade delay={160}>
                <div className="max-w-[480px] mb-[22px]">
                  <p className="text-[15px] leading-relaxed text-lp-text-muted">{hero.subtitle}</p>
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {hero.subtitleBullets.map((bullet) => (
                      <li key={bullet} className="text-[15px] leading-relaxed text-lp-text-muted">
                        ✅ {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollFade>

              <ScrollFade delay={240}>
                <LpCtaButton data-cta="hero-cta">{hero.cta}</LpCtaButton>
              </ScrollFade>
            </div>

            <ScrollFade delay={160}>
              <div id="contato">
                <div className="rounded-[22px] border border-lp-border bg-lp-panel p-5 sm:p-[26px]">
                  <h2 className="mb-1 text-[17px] font-semibold text-lp-ink">{hero.formTitle}</h2>
                  <span className="mb-4 block text-[12.5px] text-lp-text-dim">
                    {hero.formSubtitle}
                  </span>
                  <LeadForm />
                </div>
              </div>
            </ScrollFade>
          </div>
        </div>
      </div>
    </section>
  );
}
