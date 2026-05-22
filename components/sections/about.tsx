import Image from "next/image";
import ScrollFade from "@/components/ui/scroll-fade";
import { content } from "@/lib/content";

export default function About() {
  const { sectionLabel } = content.about;

  return (
    <section id="quem-somos" aria-label="Quem somos" data-section="about" className="bg-bg py-28 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">

        {/* Imagem */}
        <ScrollFade className="w-full">
          <Image
            src="/Imagem2-1.webp"
            alt="Equipe Alpha Assessoria"
            width={700}
            height={900}
            className="w-full h-auto rounded-xl"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </ScrollFade>

        {/* Texto */}
        <div className="flex flex-col gap-6">
          <ScrollFade>
            <p className="text-accent text-sm font-bold uppercase tracking-widest">
              {sectionLabel}
            </p>
          </ScrollFade>

          <ScrollFade delay={80}>
            <h2 className="font-heading uppercase leading-tight text-3xl sm:text-4xl lg:text-[2.6rem] text-text">
              <span className="font-bold">LÍDER </span>
              <span className="font-light">EM </span>
              <span className="font-bold">MARKETING GASTRONÔMICO </span>
              <span className="font-light">E PARCEIRA DO </span>
              <span className="font-bold">SEU SUCESSO.</span>
            </h2>
          </ScrollFade>

          <div className="flex flex-col gap-6">
            <ScrollFade delay={160}>
              <p className="text-text-muted leading-relaxed text-sm sm:text-base">
                Na <strong className="text-text font-bold">Alpha Assessoria</strong>, não somos apenas uma agência; somos a{" "}
                <strong className="text-text font-bold">maior assessoria de marketing especializada em restaurantes da América Latina</strong>.
                {" "}Nascemos da paixão por transformar negócios gastronômicos, elevando-os a um novo patamar de sucesso e reconhecimento.
              </p>
            </ScrollFade>

            <ScrollFade delay={240}>
              <p className="text-text-muted leading-relaxed text-sm sm:text-base">
                Com uma <strong className="text-text font-bold">estrutura 100% presencial</strong> e uma{" "}
                <strong className="text-text font-bold">equipe de mais de 80 profissionais</strong> altamente qualificados, a Alpha Assessoria é a parceira estratégica que seu restaurante precisa.
              </p>
            </ScrollFade>

            <ScrollFade delay={320}>
              <p className="text-text-muted leading-relaxed text-sm sm:text-base">
                Nosso time multidisciplinar, composto por gestores de tráfego, designers e{" "}
                <strong className="text-text font-bold">especialistas em marketing digital</strong>,
                {" "}trabalha em sinergia para garantir que cada aspecto da sua presença online e offline seja otimizado.
              </p>
            </ScrollFade>
          </div>
        </div>

      </div>
    </section>
  );
}
