import Image from "next/image";
import Eyebrow from "@/components/ui/eyebrow";
import ScrollFade from "@/components/ui/scroll-fade";
import { content } from "@/lib/content";

const { palestrante } = content;

// Mobile: 1 grande em cima + 2 lado a lado. Desktop: 1 grande à esquerda + 2 empilhadas.
const CELL = [
  "col-span-2 aspect-[4/3] md:col-span-1 md:row-span-2 md:aspect-auto",
  "aspect-[3/4] md:aspect-auto",
  "aspect-[3/4] md:aspect-auto",
];

export default function Palestrante({
  sectionLabel = palestrante.sectionLabel,
  title = palestrante.title,
}: {
  sectionLabel?: string;
  // null esconde o título (lp-09 mostra só o eyebrow + fotos).
  title?: string | null;
} = {}) {
  return (
    <section
      id="palestrante"
      aria-label="Palestrante"
      data-section="palestrante"
      className="bg-lp-white pt-20 pb-6 md:pb-20"
    >
      <div className="mx-auto max-w-[1180px] px-6">
        <ScrollFade>
          <div className={`mx-auto max-w-[640px] text-center ${title ? "mb-10" : "mb-6"}`}>
            <Eyebrow center>{sectionLabel}</Eyebrow>
            {title && (
              <h2 className="font-lp-heading mt-3.5 text-[clamp(1.9rem,4vw,2.7rem)] leading-[1.15] font-semibold text-lp-ink">
                {title}
              </h2>
            )}
          </div>
        </ScrollFade>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:h-[640px] md:grid-cols-[1.4fr_1fr] md:grid-rows-2">
          {palestrante.photos.map((photo, i) => (
            <ScrollFade key={photo.src} delay={i * 80} className={CELL[i]}>
              <div className="relative h-full overflow-hidden rounded-[22px] border border-lp-border bg-lp-panel">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  sizes={i === 0 ? "(max-width: 768px) 100vw, 680px" : "(max-width: 768px) 50vw, 480px"}
                  className="h-full w-full object-cover object-[50%_25%]"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
                />
              </div>
            </ScrollFade>
          ))}
        </div>
      </div>
    </section>
  );
}
