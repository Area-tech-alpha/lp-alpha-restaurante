import LeadForm from "@/components/lead-form";
import Eyebrow from "@/components/ui/eyebrow";
import { content } from "@/lib/content";

const { formBlock } = content.agendamento;

const fields = {
  ...formBlock.fields,
  faturamento: { options: [...content.form.fields.faturamento.options].reverse() },
};

export default function AgendamentoForm({ variant }: { variant: string }) {
  return (
    <section
      id="formulario"
      aria-labelledby="formulario-titulo"
      className="bg-lp-off px-6 py-20"
    >
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-14">
        <div>
          <Eyebrow>{formBlock.eyebrow}</Eyebrow>
          <h2
            id="formulario-titulo"
            className="mt-3.5 font-lp-display text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.12] font-semibold text-lp-ink uppercase"
          >
            {formBlock.title}
          </h2>
          <ol className="mt-8 flex flex-col gap-4">
            {formBlock.steps.map((step, i) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-[22px] border border-lp-border bg-lp-white p-5 sm:p-6"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lp-gold-1 to-lp-gold-2 font-lp-heading text-lg font-bold text-lp-on-gold"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[17px] font-semibold text-lp-ink">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-[1.55] text-lp-text-muted">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div id="contato" data-section="form" className="rounded-[22px] border border-lp-border-gold bg-lp-panel p-5 sm:p-[26px]">
          <h3 className="mb-1 text-[17px] font-semibold text-lp-ink">{formBlock.formTitle}</h3>
          <span className="mb-4 block text-[12.5px] text-lp-text-dim">{formBlock.formSubtitle}</span>
          <LeadForm variant={variant} fields={fields} submitLabel={formBlock.submitLabel} />
        </div>
      </div>
    </section>
  );
}
