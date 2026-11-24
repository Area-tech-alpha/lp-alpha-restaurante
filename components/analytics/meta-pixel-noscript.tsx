import { pixelIdForVariant } from "@/lib/meta-pixels";

// PageView sem JS do pixel próprio de uma LP (ver app/[variant]/layout.tsx).
export default function MetaPixelNoscript({ variant }: { variant?: string }) {
  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        alt=""
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${pixelIdForVariant(variant)}&ev=PageView&noscript=1`}
      />
    </noscript>
  );
}
