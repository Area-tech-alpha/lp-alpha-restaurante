import BlackFridayCta from "@/components/sections/black-friday-cta";
import { content } from "@/lib/content";

const c = content.blackFriday.depoimentos;

// Só depoimentos reais (lib/content.ts). Sem nenhum, a seção não aparece.
export default function BlackFridayDepoimentos() {
  if (c.items.length === 0) return null;

  return (
    <section aria-labelledby="bf-depoimentos" className="bg-lp-off px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-[1180px]">
        <h2
          id="bf-depoimentos"
          className="text-center font-lp-display text-[clamp(1.7rem,3.6vw,2.5rem)] leading-[1.15] font-semibold text-lp-ink"
        >
          {c.title}
        </h2>
        <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {c.items.map((d) => (
            <li
              key={`${d.nome}-${d.restaurante}`}
              className="flex flex-col rounded-2xl border border-lp-border bg-lp-panel p-5"
            >
              <p className="text-[15px] leading-[1.55] text-lp-ink">{d.resultado}</p>
              <p className="mt-4 text-sm font-semibold text-lp-gold-2">{d.nome}</p>
              <p className="text-[13px] text-lp-text-dim">
                {d.restaurante} · {d.cidade}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <BlackFridayCta id="depoimentos">{c.cta}</BlackFridayCta>
    </section>
  );
}
