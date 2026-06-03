import type { Metadata } from "next";
import { Anton, Oswald, Archivo } from "next/font/google";
import Script from "next/script";
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
  metadataBase: new URL("https://assessorialpha.com"), // atualizar se domínio mudar
  title: "Assessoria Alpha — Marketing Gastronômico para Restaurantes",
  description:
    "A maior assessoria de marketing gastronômico da América Latina. +600 clientes ativos, +500M em vendas geradas. Estruture o marketing do seu restaurante.",
  openGraph: {
    title: "Assessoria Alpha — Marketing Gastronômico para Restaurantes",
    description:
      "A maior assessoria de marketing gastronômico da América Latina. +600 clientes ativos, +500M em vendas geradas. Estruture o marketing do seu restaurante.",
    locale: "pt_BR",
    type: "website",
    // TODO: substituir por imagem raster 1200×630 antes do go-live (assets pendentes do cliente)
    // images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Assessoria Alpha" }],
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
      <body className="min-h-full bg-bg text-text antialiased" suppressHydrationWarning>
        {children}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">{`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
              fbq('track','PageView');
            `}</Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </body>
    </html>
  );
}
