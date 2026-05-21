import LeadForm from "@/components/lead-form";
import { content } from "@/lib/content";

const { form: c } = content;

export default function FormSection() {
  return (
    <section
      id="formulario"
      aria-label="Formulário de contato"
      className="bg-bg py-20 px-4"
    >
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Coluna esquerda — copy */}
        <div className="flex flex-col gap-8">
          {/* Label */}
          <span className="text-xs font-bold tracking-widest uppercase text-accent">
            {c.sectionLabel}
          </span>

          {/* Título */}
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-white uppercase leading-tight">
            NÃO SAIA AGORA! FALTAM{" "}
            <span className="font-black">POUCOS SEGUNDOS</span> PARA SEU
            RESTAURANTE <span className="font-black">MUDAR.</span>
          </h2>

          {/* Cards numerados */}
          <div className="flex flex-col gap-4">
            {c.steps.map((step) => (
              <div
                key={step.number}
                className="bg-bg-card rounded-xl p-5 flex gap-4 items-start"
              >
                <span
                  aria-hidden="true"
                  className="shrink-0 w-8 h-8 rounded-full bg-accent text-text-on-light font-black text-sm flex items-center justify-center"
                >
                  {step.number}
                </span>
                <div>
                  <p className="font-bold text-white mb-1">{step.title}</p>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna direita — formulário */}
        <div className="bg-bg-card rounded-2xl p-6 lg:p-8">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
