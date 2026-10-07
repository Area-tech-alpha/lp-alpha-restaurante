export type Theme = "gold" | "black";

export type Variant = {
  theme: Theme;
  // Trechos entre *asteriscos* ganham o destaque dourado.
  headline: string;
  // Condições curtas exibidas sob o formulário (garantia, etc.).
  footnote?: string;
  countdown?: { label: string };
};

const GUARANTEE_NOTE =
  "*Garantia de devolução do investimento, conforme condições do contrato.";

export const variants = {
  "lp-01": {
    theme: "gold",
    headline:
      "Utilize nosso serviço de marketing, e *se não gostar devolvemos o seu dinheiro*",
    footnote: GUARANTEE_NOTE,
  },
  "lp-02": {
    theme: "gold",
    headline:
      "Aplique o método que vai *dobrar o faturamento do seu delivery* e caso você não goste devolvemos o seu dinheiro",
    footnote: GUARANTEE_NOTE,
  },
  "lp-03": {
    theme: "gold",
    headline:
      "Aplique o método que vai fazer o seu restaurante *crescer 3x mais* e caso você não goste devolvemos o seu dinheiro",
    footnote: GUARANTEE_NOTE,
  },
  "lp-04": {
    theme: "gold",
    headline:
      "Com apenas *2.000 reais* vamos entregar o restaurante dos seus sonhos em apenas *30 dias*",
  },
  "lp-05": {
    theme: "black",
    headline:
      "Vamos copiar e colar o mesmo método que fez a Alpha's Pizzaria *faturar 400k* no seu restaurante, e se não aumentarmos suas vendas devolvemos o seu dinheiro",
    footnote: GUARANTEE_NOTE,
  },
  "lp-06": {
    theme: "black",
    headline:
      "Vamos aplicar o mesmo método que fez a Alpha's Pizzaria *faturar 400k* no seu restaurante *de graça*, aproveite ainda esse mês",
    countdown: { label: "Essa condição gratuita encerra em" },
  },
  "lp-07": {
    theme: "black",
    headline:
      "*Terceirize o seu marketing* e dobre o faturamento do seu restaurante nos próximos 6 meses",
  },
  "lp-08": {
    theme: "black",
    headline:
      "*Terceirize o seu marketing* e dobre o faturamento do seu delivery nos próximos 3 meses",
  },
} as const satisfies Record<string, Variant>;

export type VariantSlug = keyof typeof variants;

export const variantSlugs = Object.keys(variants) as VariantSlug[];

export function isVariantSlug(value: string): value is VariantSlug {
  return value in variants;
}

// Extrai o slug da variação a partir da URL de entrada da sessão (landingUrl).
export function variantFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/(lp-\d{2})(?:[/?#]|$)/);
  return match ? match[1] : null;
}
