import type { Metadata } from "next";
import { Anton, Oswald, Archivo } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Assessoria Alpha — Marketing Gastronômico para Restaurantes",
  description:
    "A maior assessoria de marketing gastronômico da América Latina. +600 clientes ativos, +500M em vendas geradas. Estruture o marketing do seu restaurante.",
  openGraph: {
    title: "Assessoria Alpha — Marketing Gastronômico para Restaurantes",
    description:
      "A maior assessoria de marketing gastronômico da América Latina. +600 clientes ativos, +500M em vendas geradas. Estruture o marketing do seu restaurante.",
    locale: "pt_BR",
    type: "website",
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
      <body className="min-h-full bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
