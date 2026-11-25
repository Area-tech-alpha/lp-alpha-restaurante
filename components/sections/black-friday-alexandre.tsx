import Image from "next/image";
import BlackFridayCta from "@/components/sections/black-friday-cta";
import { content } from "@/lib/content";

const c = content.blackFriday.alexandre;

export default function BlackFridayAlexandre() {
  return (
    <section aria-labelledby="bf-alexandre" className="bg-lp-off px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="grid grid-cols-2 gap-3">
          {c.photos.map((p, i) => (
            <div
              key={p.src}
              className={`relative overflow-hidden rounded-2xl border border-lp-border ${
                i === 0 || i === 3 ? "col-span-2 aspect-[3/2]" : "aspect-[4/5]"
              }`}
            >
              <Image
                src={p.src}
                alt={p.alt}
                width={p.width}
                height={p.height}
                sizes={i === 0 || i === 3 ? "(min-width: 768px) 560px, 100vw" : "(min-width: 768px) 280px, 50vw"}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        <div>
          <h2
            id="bf-alexandre"
            className="font-lp-display text-[clamp(1.7rem,3.6vw,2.5rem)] leading-[1.15] font-semibold text-lp-ink"
          >
            {c.title}
          </h2>
          {c.paragraphs.map((p) => (
            <p key={p} className="mt-4 text-base leading-[1.6] text-lp-text-muted">
              {p}
            </p>
          ))}
          <p className="mt-6 font-semibold text-lp-ink">{c.accessTitle}</p>
          <ul className="mt-3 flex flex-col gap-3">
            {c.access.map((a) => (
              <li
                key={a.title}
                className="rounded-2xl border border-lp-border-gold bg-lp-panel p-4 text-[15px] leading-[1.55] text-lp-text-muted"
              >
                <strong className="text-lp-gold-2">{a.title}</strong> {a.text}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-base leading-[1.6] font-semibold text-lp-ink">{c.closing}</p>
        </div>
      </div>
      <BlackFridayCta id="alexandre">{c.cta}</BlackFridayCta>
    </section>
  );
}
