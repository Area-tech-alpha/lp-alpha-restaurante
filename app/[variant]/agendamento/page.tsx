import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import AgendamentoPicker from "@/components/agendamento-picker";
import Clarity from "@/components/analytics/clarity";
import { PageEvent } from "@/components/analytics/page-event";
import { content } from "@/lib/content";
import { agendamentoSlugs, hasAgendamento, variants } from "@/lib/variants";

const { pagina } = content.agendamento;

// O ?t= é lido no client (AgendamentoPicker), então a página continua SSG.
export const dynamicParams = false;

export function generateStaticParams() {
  return agendamentoSlugs.map((variant) => ({ variant }));
}

export const metadata: Metadata = {
  title: pagina.metaTitle,
  robots: { index: false, follow: false },
};

export default async function AgendamentoPage({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;
  if (!hasAgendamento(variant)) notFound();

  return (
    <div data-theme={variants[variant].theme} className="min-h-screen bg-lp-off">
      <Clarity />
      <PageEvent event="agendamento_view" tags={{ variant }} />
      <main className="relative overflow-hidden px-5 pt-10 pb-16 sm:px-6 md:pt-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,183,3,0.16),transparent_65%)]"
        />

        <div className="relative mx-auto max-w-[760px] text-center">
          <div className="flex flex-col items-center gap-2">
            <Image
              src="/logo-alpha-header.png"
              alt={content.hero.logoAlt}
              width={260}
              height={84}
              priority
              className="h-8 w-auto brightness-0 invert"
            />
            <span className="text-[13px] font-semibold tracking-[.08em] text-lp-text-muted uppercase">
              {pagina.brand}
            </span>
          </div>

          <span className="mt-8 inline-flex rounded-full border border-lp-border-gold bg-lp-gold-2/10 px-4 py-1.5 text-[12px] font-bold tracking-[.1em] text-lp-gold-1 uppercase">
            {pagina.pill}
          </span>

          <h1 className="mt-5 font-lp-display text-[clamp(1.9rem,5vw,3rem)] leading-[1.1] font-semibold text-lp-ink">
            {pagina.title}
          </h1>
          <p className="mx-auto mt-4 max-w-[600px] text-base leading-relaxed text-lp-text-muted">
            {pagina.subtitle}
          </p>

          <ul className="mt-6 flex flex-wrap justify-center gap-2.5">
            {pagina.chips.map((chip) => (
              <li
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-full border border-lp-border bg-lp-panel px-3.5 py-1.5 text-[13px] text-lp-text"
              >
                <Check className="h-3.5 w-3.5 text-lp-gold-1" aria-hidden="true" />
                {chip}
              </li>
            ))}
          </ul>
        </div>

        <section
          aria-labelledby="agendamento-card-titulo"
          className="relative mx-auto mt-10 max-w-[760px] rounded-[26px] border border-lp-border bg-lp-white p-5 shadow-[0_40px_90px_-40px_rgba(255,183,3,0.35)] sm:p-8"
        >
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="agendamento-card-titulo" className="text-lg font-semibold text-lp-ink">
              {pagina.cardTitle}
            </h2>
            <span className="text-[13px] text-lp-text-dim">· {pagina.timezoneLabel}</span>
          </div>
          <Suspense fallback={<p className="py-10 text-center text-lp-text-muted">{pagina.loading}</p>}>
            <AgendamentoPicker />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
