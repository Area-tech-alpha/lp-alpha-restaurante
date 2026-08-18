import Eyebrow from "@/components/ui/eyebrow";
import LpCtaButton from "@/components/ui/lp-cta-button";
import ScrollFade from "@/components/ui/scroll-fade";
import { content } from "@/lib/content";

const { ctaFinal } = content;

export default function CtaFinal() {
  return (
    <section id="cta-final" aria-label="Chamada final" data-section="cta-final" className="bg-lp-white pt-5 pb-[90px]">
      <div className="mx-auto max-w-[1180px] px-6">
        <ScrollFade>
          <div
            className="mx-auto max-w-[760px] rounded-[32px] p-9 text-center shadow-[0_40px_90px_-30px_rgba(20,16,5,0.4)] sm:p-[54px_30px]"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(255,183,3,.16), transparent 55%), radial-gradient(circle at 80% 80%, rgba(245,166,35,.14), transparent 50%), var(--lp-ink)",
            }}
          >
            <Eyebrow center>
              <span className="text-lp-gold-1">{ctaFinal.eyebrow}</span>
            </Eyebrow>
            <h2 className="font-lp-display text-[clamp(1.7rem,4vw,2.4rem)] leading-[1.2] font-semibold text-white mt-3.5 mb-4">
              {ctaFinal.headlinePrefix}
              <span className="lp-gold-text">{ctaFinal.headlineHighlight1}</span>
              {ctaFinal.headlineMiddle}
              <span className="lp-gold-text">{ctaFinal.headlineHighlight2}</span>
              {ctaFinal.headlineSuffix}
            </h2>
            <p className="mx-auto mb-[30px] max-w-[520px] text-[15px] leading-relaxed text-white/65">
              {ctaFinal.paragraph}
            </p>
            <LpCtaButton data-cta="cta-final">{ctaFinal.cta}</LpCtaButton>
          </div>
        </ScrollFade>
      </div>
    </section>
  );
}
