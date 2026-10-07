import Image from "next/image";
import LeadForm from "@/components/lead-form";
import { content } from "@/lib/content";
import type { Theme } from "@/lib/variants";

const { hero } = content;

function renderHeadline(text: string) {
  return text.split("*").map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="lp-gold-text">
        {part}
      </span>
    ) : (
      part
    )
  );
}

export default function LpHero({
  headline,
  footnote,
  theme,
}: {
  headline: string;
  footnote?: string;
  theme: Theme;
}) {
  return (
    <section
      id="hero"
      aria-label="Hero"
      data-section="hero"
      className="relative overflow-hidden bg-lp-hero-bg px-3 pt-6 pb-10 sm:px-4 sm:pt-9 sm:pb-[60px]"
    >
      {theme === "gold" ? (
        <Image
          src="/hero-nova-00-lp.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_50%,rgba(255,183,3,0.14),transparent_55%)]"
        />
      )}

      <div className="relative z-10 mx-auto max-w-[1160px]">
        <div className="rounded-[32px] border border-lp-border bg-lp-white p-5 shadow-[0_50px_110px_-30px_rgba(20,16,5,0.45)] sm:p-6 md:p-9">
          <div className="mb-6 flex items-center justify-center md:justify-start">
            <a href="https://assessorialpha.com">
              <Image
                src="/logo-alpha-header.png"
                alt={hero.logoAlt}
                width={260}
                height={84}
                priority
                className={`h-7 w-auto ${theme === "black" ? "brightness-0 invert" : ""}`}
              />
            </a>
          </div>

          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1.05fr_.95fr]">
            <h1 className="font-lp-display text-[clamp(1.9rem,4.4vw,3.1rem)] leading-[1.12] font-semibold text-lp-ink">
              {renderHeadline(headline)}
            </h1>
            <div id="contato">
              <div
                data-section="form"
                className="rounded-[22px] border border-lp-border bg-lp-panel p-5 sm:p-[26px]"
              >
                <h2 className="mb-1 text-[17px] font-semibold text-lp-ink">{hero.formTitle}</h2>
                <span className="mb-4 block text-[12.5px] text-lp-text-dim">
                  {hero.formSubtitle}
                </span>
                <LeadForm />
              </div>
              {footnote && (
                <p className="mt-3 text-center text-[11.5px] leading-snug text-lp-text-dim">
                  {footnote}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
