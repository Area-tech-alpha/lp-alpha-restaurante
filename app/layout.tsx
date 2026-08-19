import type { Metadata, Viewport } from "next";
import { Anton, Oswald, Archivo, Inter } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
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
      </head>
      <body className="min-h-full bg-bg text-text antialiased" suppressHydrationWarning>
        {children}
        <SpeedInsights />
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            alt=""
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
      </body>
    </html>
  );
}
