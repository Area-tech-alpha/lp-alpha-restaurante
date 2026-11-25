import Image from "next/image";
import { Check } from "lucide-react";
import BlackFridayCta from "@/components/sections/black-friday-cta";
import { content } from "@/lib/content";

const c = content.blackFriday.cardapio;

export default function BlackFridayCardapio() {
  return (
    <section aria-labelledby="bf-cardapio" className="bg-lp-panel px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-[880px]">
        <Image
          src={c.logo.src}
          alt={c.logo.alt}
          width={c.logo.width}
          height={c.logo.height}
          sizes="240px"
          className="mx-auto h-auto w-[200px] sm:w-[240px]"
        />
        <h2
          id="bf-cardapio"
          className="mt-8 text-center font-lp-display text-[clamp(1.7rem,3.6vw,2.5rem)] leading-[1.15] font-semibold text-lp-ink"
        >
          {c.title}
        </h2>
        <p className="mt-5 text-base leading-[1.6] text-lp-text-muted">{c.text}</p>
        <ul className="mt-8 flex flex-col gap-3">
          {c.items.map((item) => (
            <li
              key={item.title}
              className="flex gap-3 rounded-2xl border border-lp-border bg-lp-off p-4 text-[15px] leading-[1.55] text-lp-text-muted"
            >
              <Check aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-lp-gold-2" />
              <span>
                <strong className="text-lp-ink">{item.title}</strong> {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <BlackFridayCta id="cardapio">{c.cta}</BlackFridayCta>
    </section>
  );
}
