import { FaqJsonLd } from "@/components/json-ld";
import AgendamentoHero from "@/components/sections/agendamento-hero";
import Marquee from "@/components/sections/marquee";
import AgendamentoForm from "@/components/sections/agendamento-form";
import Testimonials from "@/components/sections/testimonials";
import Palestrante from "@/components/sections/palestrante";
import Entregaveis from "@/components/sections/entregaveis";
import Faq from "@/components/sections/faq";
import Footer from "@/components/sections/footer";
import Tracker from "@/components/analytics/tracker";
import Clarity from "@/components/analytics/clarity";
import StickyCta from "@/components/ui/sticky-cta";
import { content } from "@/lib/content";
import type { Theme } from "@/lib/variants";

const lp = content.agendamento;

// Composição das variações com layout "agendamento" (estrutura da LP da Laquila).
export default function AgendamentoLanding({
  variant,
  theme,
  headline,
  faqItems,
}: {
  variant: string;
  theme: Theme;
  headline: string;
  faqItems: readonly { question: string; answer: string }[];
}) {
  return (
    <div data-theme={theme} className="bg-lp-off">
      <main>
        <Tracker variant={variant} />
        <Clarity />
        <StickyCta label={lp.hero.cta} />
        <AgendamentoHero headline={headline} />
        <Marquee items={lp.marquee} />
        <AgendamentoForm variant={variant} />
        <Testimonials
          layout="carousel"
          sectionLabel={lp.testimonials.sectionLabel}
          title={lp.testimonials.title}
        />
        <Palestrante sectionLabel={lp.quemSomos.sectionLabel} title={null} />
        <Entregaveis
          layout="carousel"
          showRoi={false}
          sectionLabel={lp.oQueFazemos.sectionLabel}
          title={lp.oQueFazemos.title}
        />
        <Faq items={faqItems} />
        <FaqJsonLd items={faqItems} />
      </main>
      <Footer />
    </div>
  );
}
