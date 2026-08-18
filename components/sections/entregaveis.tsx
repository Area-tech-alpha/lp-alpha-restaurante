import { FileBarChart, Store, Target, Users } from "lucide-react";
import Eyebrow from "@/components/ui/eyebrow";
import ScrollFade from "@/components/ui/scroll-fade";
import { content } from "@/lib/content";

const { entregaveis } = content;

const ICONS = {
  users: Users,
  target: Target,
  store: Store,
  "file-bar-chart": FileBarChart,
} as const;

export default function Entregaveis() {
  return (
    <section
      id="entregaveis"
      aria-label="O que você recebe"
      data-section="entregaveis"
      className="py-20"
    >
      <div className="mx-auto max-w-[1180px] px-6">
        <ScrollFade>
          <div className="mb-11 max-w-[640px]">
            <Eyebrow>{entregaveis.sectionLabel}</Eyebrow>
            <h2 className="font-lp-heading text-[clamp(1.9rem,4vw,2.7rem)] leading-[1.15] font-semibold text-lp-ink mt-3.5">
              {entregaveis.title}
            </h2>
            <p className="mt-3.5 text-base leading-relaxed text-lp-text-muted">
              {entregaveis.subtitle}
            </p>
          </div>
        </ScrollFade>

        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {entregaveis.cards.map((card, i) => {
            const Icon = ICONS[card.icon as keyof typeof ICONS];
            return (
              <ScrollFade key={card.title} delay={i * 80}>
                <div className="h-full rounded-[22px] border border-lp-border bg-lp-off p-7 transition-transform duration-300 hover:-translate-y-1 hover:border-lp-border-gold">
                  <div className="mb-[18px] flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgba(255,183,3,0.18)] to-[rgba(245,166,35,0.06)]">
                    <Icon className="h-[22px] w-[22px] text-lp-gold-2" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-[17px] font-semibold text-lp-ink">{card.title}</h3>
                  <p className="text-sm leading-[1.55] text-lp-text-muted">{card.description}</p>
                </div>
              </ScrollFade>
            );
          })}
        </div>

        <ScrollFade>
          <div className="mt-11 flex flex-col gap-1.5 rounded-[32px] bg-lp-ink p-9 text-center sm:p-[34px]">
            <span className="text-[13.5px] font-semibold tracking-[.05em] text-white/60 uppercase">
              {entregaveis.roi.label}
            </span>
            <strong className="font-lp-display text-[clamp(1.6rem,4vw,2.3rem)] font-semibold text-white">
              {entregaveis.roi.prefix}
              <em className="lp-gold-text not-italic">{entregaveis.roi.highlight}</em>
              {entregaveis.roi.suffix}
            </strong>
          </div>
        </ScrollFade>
      </div>
    </section>
  );
}
