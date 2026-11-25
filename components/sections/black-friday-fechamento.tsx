import BlackFridayCta from "@/components/sections/black-friday-cta";
import { content } from "@/lib/content";

const c = content.blackFriday.fechamento;

export default function BlackFridayFechamento() {
  return (
    <section
      aria-labelledby="bf-fechamento"
      className="border-t-4 border-lp-gold-2 bg-lp-panel px-4 py-16 sm:px-6 md:py-24"
    >
      <div className="mx-auto max-w-[820px] text-center">
        <h2
          id="bf-fechamento"
          className="font-lp-display text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.15] font-semibold text-lp-ink"
        >
          {c.title}
        </h2>
        <p className="mt-5 text-base leading-[1.65] text-lp-text-muted">{c.text}</p>
      </div>
      <BlackFridayCta id="fechamento">{c.cta}</BlackFridayCta>
    </section>
  );
}
