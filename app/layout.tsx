import type { Metadata, Viewport } from "next";
import { Anton, Oswald, Archivo } from "next/font/google";
import Script from "next/script";
import { OrganizationJsonLd } from "@/components/json-ld";
import "./globals.css";

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});

const archivo = Archivo({
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#F5A623",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://assessorialpha.com"),
  title: "Assessoria Alpha — Marketing Gastronômico para Restaurantes",
  description:
    "A maior assessoria de marketing gastronômico da América Latina. +600 clientes ativos, +500M em vendas geradas. Estruture o marketing do seu restaurante.",
  keywords: [
    "marketing gastronômico",
    "marketing para restaurantes",
    "assessoria de restaurante",
    "marketing digital para restaurantes",
    "marketing iFood",
    "agência marketing gastronômico",
  ],
  authors: [{ name: "Assessoria Alpha", url: "https://assessorialpha.com" }],
  alternates: {
    canonical: "https://assessorialpha.com",
  },
  openGraph: {
    title: "Assessoria Alpha — Marketing Gastronômico para Restaurantes",
    description:
      "A maior assessoria de marketing gastronômico da América Latina. +600 clientes ativos, +500M em vendas geradas. Estruture o marketing do seu restaurante.",
    locale: "pt_BR",
    type: "website",
    url: "https://assessorialpha.com",
    siteName: "Assessoria Alpha",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Assessoria Alpha — Marketing Gastronômico para Restaurantes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Assessoria Alpha — Marketing Gastronômico para Restaurantes",
    description:
      "A maior assessoria de marketing gastronômico da América Latina. +600 clientes ativos, +500M em vendas geradas.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${anton.variable} ${oswald.variable} ${archivo.variable}`}
    >
      <head>
        <OrganizationJsonLd />
        <Script id="gtm" strategy="beforeInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
        `}</Script>
      </head>
      <body className="min-h-full bg-bg text-text antialiased" suppressHydrationWarning>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
