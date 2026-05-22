import LeadForm from "@/components/lead-form";
import ScrollFade from "@/components/ui/scroll-fade";
import { content } from "@/lib/content";

const { form: c } = content;

export default function FormSection() {
  return (
    <section
      aria-label="Formulário de contato"
      data-section="form"
      className="bg-bg py-20 px-4"
    >
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
        {/* Coluna esquerda — copy */}
        <div className="flex flex-col gap-8">
          {/* Label + Título */}
          <ScrollFade>
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold tracking-widest uppercase text-accent">
                {c.sectionLabel}
              </span>

              <h2 className="font-heading text-3xl lg:text-4xl xl:text-5xl text-white uppercase leading-[1.05]">
                <span className="font-black">NÃO SAIA AGORA!</span>
                <br />
                FALTAM <span className="font-black">POUCOS</span>
                <br />
                <span className="font-black">SEGUNDOS</span> PARA SEU
                <br />
                RESTAURANTE <span className="font-black">MUDAR.</span>
              </h2>
            </div>
          </ScrollFade>

          {/* Cards numerados */}
          <div className="flex flex-col gap-5">
            {c.steps.map((step, i) => (
              <ScrollFade key={step.number} delay={i * 150 + 120}>
                <div className="bg-bg-card rounded-xl p-7 flex gap-5 items-start">
                  <span
                    aria-hidden="true"
                    className="shrink-0 w-11 h-11 rounded-full bg-accent text-text-on-light font-black text-base flex items-center justify-center"
                  >
                    {step.number}
                  </span>
                  <div>
                    <p className="font-bold text-white text-lg lg:text-xl mb-2">
                      {step.title}
                    </p>
                    <p className="text-text-muted text-base lg:text-lg leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </ScrollFade>
            ))}
          </div>
        </div>

        {/* Coluna direita — formulário */}
        <div id="formulario" className="bg-bg-card rounded-2xl p-6 lg:p-8 flex flex-col justify-center">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
