import { Plus } from "lucide-react";
import Eyebrow from "@/components/ui/eyebrow";
import ScrollFade from "@/components/ui/scroll-fade";
import { content } from "@/lib/content";

const { faq } = content;

export default function Faq() {
  return (
    <section id="faq" aria-label="Perguntas frequentes" data-section="faq" className="bg-lp-off py-20">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="grid grid-cols-1 gap-9 md:grid-cols-[.8fr_1.2fr] md:items-start">
          <ScrollFade>
            <div>
              <Eyebrow>{faq.sectionLabel}</Eyebrow>
              <h2 className="font-lp-heading text-[clamp(1.9rem,4vw,2.7rem)] leading-[1.15] font-semibold text-lp-ink mt-3.5">
                {faq.title}
              </h2>
            </div>
          </ScrollFade>

          <ScrollFade delay={80}>
            <div className="flex flex-col gap-3.5">
              {faq.items.map((item, i) => (
                <details
                  key={item.question}
                  open={i === 0}
                  className="group rounded-2xl border border-lp-border bg-lp-white p-[22px_24px] transition-colors hover:border-lp-border-gold [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-lp-heading text-[15.5px] font-semibold text-lp-ink">
                    {item.question}
                    <Plus
                      className="h-[18px] w-[18px] shrink-0 text-lp-gold-2 transition-transform duration-300 group-open:rotate-45"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="mt-3.5 text-[14.5px] leading-relaxed text-lp-text-muted">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </ScrollFade>
        </div>
      </div>
    </section>
  );
}
