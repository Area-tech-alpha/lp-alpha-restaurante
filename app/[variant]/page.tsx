import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaqJsonLd } from "@/components/json-ld";
import LpHero from "@/components/sections/lp-hero";
import Palestrante from "@/components/sections/palestrante";
import Testimonials from "@/components/sections/testimonials";
import Universidade from "@/components/sections/universidade";
import Entregaveis from "@/components/sections/entregaveis";
import Faq from "@/components/sections/faq";
import Footer from "@/components/sections/footer";
import Tracker from "@/components/analytics/tracker";
import Clarity from "@/components/analytics/clarity";
import StickyCta from "@/components/ui/sticky-cta";
import CountdownBar from "@/components/ui/countdown-bar";
import { content } from "@/lib/content";
import { isVariantSlug, variants, variantSlugs, type Variant } from "@/lib/variants";

export const dynamicParams = false;

export function generateStaticParams() {
  return variantSlugs.map((variant) => ({ variant }));
}

// A primeira pergunta do FAQ fala do "15 por 1", que não vale para as variações.
const faqItems = content.faq.items.slice(1);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ variant: string }>;
}): Promise<Metadata> {
  const { variant } = await params;
  if (!isVariantSlug(variant)) return {};
  const title = "Alpha Assessoria: Marketing para Restaurantes";
  const description =
    "A maior assessoria de marketing gastronômico da América Latina, com estrutura 100% presencial.";
  return {
    title,
    description,
    openGraph: { title, description, siteName: "Alpha Assessoria", locale: "pt_BR", images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
    alternates: { canonical: "https://assessorialpha.com" },
    robots: { index: false, follow: false },
  };
}

export default async function VariantPage({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;
  if (!isVariantSlug(variant)) notFound();
  const config: Variant = variants[variant];

  return (
    <div data-theme={config.theme} className="bg-lp-off">
      {config.countdown && (
        <CountdownBar label={config.countdown.label} endsAt={config.countdown.endsAt} />
      )}
      <main>
        <Tracker variant={variant} />
        <Clarity />
        <StickyCta label={content.hero.cta} />
        <LpHero headline={config.headline} footnote={config.footnote} theme={config.theme} />
        {config.palestrante && <Palestrante />}
        {config.universidade && <Universidade />}
        <Testimonials />
        <Entregaveis showRoi={false} />
        <Faq items={faqItems} />
        <FaqJsonLd items={faqItems} />
      </main>
      <Footer />
    </div>
  );
}
