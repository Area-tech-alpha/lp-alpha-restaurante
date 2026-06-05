import { content } from "@/lib/content";

export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Assessoria Alpha",
    url: "https://assessorialpha.com",
    logo: "https://assessorialpha.com/Logo-Alpha.png.webp",
    description:
      "A maior assessoria de marketing gastronômico da América Latina. +600 clientes ativos, +500M em vendas geradas.",
    sameAs: [
      content.footer.socials.instagram,
      content.footer.socials.linkedin,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FaqJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
