import type { Metadata, Viewport } from "next";
import { Anton, Oswald, Archivo, Inter } from "next/font/google";
import localFont from "next/font/local";
import { Partytown } from "@qwik.dev/partytown/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
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

// Fontes da home (LP "00-lp-b") — auto-hospedadas a partir dos arquivos do
// Fontshare (ver public/fonts), nunca via CDN externo em runtime.
const clashDisplay = localFont({
  src: [
    { path: "../public/fonts/ClashDisplay-500.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/ClashDisplay-600.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/ClashDisplay-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-clash-display",
  display: "swap",
});

const generalSans = localFont({
  src: [
    { path: "../public/fonts/GeneralSans-500.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/GeneralSans-600.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/GeneralSans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-general-sans",
  display: "swap",
});

const inter = Inter({
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#F5A623",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://assessorialpha.com"),
  title: "Alpha Assessoria: 15 Reais de Retorno pra Cada 1 Investido em Tráfego Pago",
  description:
    "A Alpha Assessoria faz seu restaurante vender 15 reais a cada 1 investido em tráfego pago. Estrutura 100% presencial, metodologia validada por mais de 3.000 clientes.",
  keywords: [
    "marketing gastronômico",
    "marketing para restaurantes",
    "assessoria de restaurante",
    "marketing digital para restaurantes",
    "marketing iFood",
    "agência marketing gastronômico",
    "tráfego pago para restaurantes",
  ],
  authors: [{ name: "Assessoria Alpha", url: "https://assessorialpha.com" }],
  alternates: {
    canonical: "https://assessorialpha.com",
  },
  openGraph: {
    title: "Fazemos seu restaurante vender 15 reais a cada 1 investido em Tráfego Pago",
    description:
      "Estrutura 100% presencial, metodologia validada por mais de 3.000 clientes de restaurante.",
    locale: "pt_BR",
    type: "website",
    url: "https://assessorialpha.com",
    siteName: "Alpha Assessoria",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Alpha Assessoria",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fazemos seu restaurante vender 15 reais a cada 1 investido em Tráfego Pago",
    description:
      "Estrutura 100% presencial, metodologia validada por mais de 3.000 clientes de restaurante.",
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
      className={`${anton.variable} ${oswald.variable} ${archivo.variable} ${clashDisplay.variable} ${generalSans.variable} ${inter.variable}`}
    >
      <head>
        <OrganizationJsonLd />
        <Partytown debug={false} forward={["dataLayer.push"]} />
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
        <SpeedInsights />
        {/* next/script's strategy="worker" does not render under the App Router
            (confirmed against Next's own docs + verified empirically), so the
            Partytown script is authored as a plain tag: Partytown's runtime
            (registered above via <Partytown>) scans the DOM for
            script[type="text/partytown"] and moves it into the worker itself. */}
        <script
          type="text/partytown"
          id="gtm"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
            `,
          }}
        />
      </body>
    </html>
  );
}
