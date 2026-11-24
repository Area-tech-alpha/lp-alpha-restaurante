import { LP_PIXEL_IDS } from "@/lib/meta-pixels";
import MetaPixelNoscript from "@/components/analytics/meta-pixel-noscript";

// PageView sem JS do pixel próprio da LP (lp-10). As demais LPs usam o noscript do
// layout raiz.
export default async function VariantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;
  return (
    <>
      {children}
      {LP_PIXEL_IDS[variant] && <MetaPixelNoscript variant={variant} />}
    </>
  );
}
