import { Check } from "lucide-react";
import LeadForm from "@/components/lead-form";
import { renderHeadline } from "@/components/sections/lp-hero";
import { content } from "@/lib/content";

const { hero } = content.blackFriday;

// Faturamento do maior para o menor, como na lp-09.
const fields = {
  faturamento: { options: [...content.form.fields.faturamento.options].reverse() },
};

// Mobile: título → bônus (se visíveis, compactos) → form.
// Desktop: título e bônus à esquerda, form à direita.
export default function BlackFridayHero({ variant }: { variant: string }) {
  return (
    <section
      aria-labelledby="bf-titulo"
      className="relative overflow-hidden bg-lp-off px-4 pt-5 pb-14 sm:px-6 md:pt-14 md:pb-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-lp-gold-2/15 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-[1180px] grid-cols-1 gap-5 md:grid-cols-[1.1fr_1fr] md:gap-x-14 md:gap-y-8">
        <div className="md:col-start-1 md:row-start-1">
          <h1
            id="bf-titulo"
            className="font-lp-display text-[24px] leading-[1.15] font-semibold text-lp-ink sm:text-[34px] md:text-[44px]"
          >
            {renderHeadline(hero.title)}
          </h1>
          <h2 className="mt-3 text-[15px] leading-[1.5] font-normal text-lp-text-muted md:mt-5 md:text-lg">
            {hero.subtitle}
          </h2>
        </div>

        {hero.bonusVisible && (
          <div className="md:col-start-1 md:row-start-2">
            <h3 className="font-lp-heading text-xs font-bold tracking-[.08em] text-lp-gold-2 uppercase md:text-sm">
              {hero.bonusTitle}
            </h3>
            <ul className="mt-2 flex flex-col gap-1.5 md:mt-3 md:gap-3">
              {hero.bonus.map((b) => (
                <li
                  key={b}
                  className="flex gap-2 rounded-xl border border-lp-border bg-lp-white px-3 py-2 text-[13px] leading-[1.35] text-lp-ink md:gap-3 md:rounded-2xl md:p-4 md:text-[15px] md:leading-[1.45]"
                >
                  <Check aria-hidden="true" className="mt-px h-4 w-4 shrink-0 text-lp-gold-2 md:mt-0.5 md:h-5 md:w-5" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          id="formulario"
          data-section="form"
          className="scroll-mt-28 rounded-[22px] border border-lp-border-gold bg-lp-panel p-4 shadow-[0_20px_60px_rgba(245,166,35,0.12)] sm:p-[26px] md:col-start-2 md:row-span-2 md:row-start-1"
        >
          <LeadForm variant={variant} fields={fields} submitLabel={hero.submitLabel} />
          <p className="mt-3 text-center text-[12.5px] leading-[1.5] text-lp-text-dim">{hero.formNote}</p>
        </div>
      </div>
    </section>
  );
}
