import Image from "next/image";
import ScrollFade from "@/components/ui/scroll-fade";
import { content } from "@/lib/content";

export default function Plans() {
  const { sectionLabel, paragraph } = content.plans;

  return (
    <section id="planos" aria-label="Planos personalizados" className="bg-bg py-20 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Text */}
        <ScrollFade>
          <p className="text-accent text-xs font-bold uppercase tracking-widest mb-4">
            {sectionLabel}
          </p>

          <h2 className="font-heading uppercase leading-tight text-3xl sm:text-4xl lg:text-[2.6rem] text-text mb-6">
            <span className="font-light">VOCÊ </span>
            <span className="font-bold">ESCOLHE </span>
            <span className="font-light">A </span>
            <span className="font-bold">SOLUÇÃO CERTA </span>
            <span className="font-light">PARA A FASE QUE SEU RESTAURANTE </span>
            <span className="font-bold">VIVE HOJE.</span>
          </h2>

          <p className="text-text-muted leading-relaxed text-sm sm:text-base max-w-lg">
            {paragraph}
          </p>
        </ScrollFade>

        {/* Chart image */}
        <ScrollFade delay={150} className="w-full">
          <Image
            src="/grafico.webp"
            alt="Gráfico ilustrativo de crescimento por plataformas"
            width={600}
            height={400}
            className="w-full h-auto"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </ScrollFade>

      </div>
    </section>
  );
}
