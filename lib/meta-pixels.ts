// Aceita vários pixels separados por vírgula. NEXT_PUBLIC_META_PIXEL_ID (singular)
// continua válido como fallback para não quebrar ambientes já configurados.
export function getMetaPixelIds(): string[] {
  const raw =
    process.env.NEXT_PUBLIC_META_PIXEL_IDS ?? process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
  return [...new Set(raw.split(",").map((id) => id.trim()).filter((id) => /^\d+$/.test(id)))];
}

// Cada pixel tem seu próprio token da CAPI: META_CAPI_TOKEN_<pixelId>, com
// META_CAPI_TOKEN como fallback (cobre o caso de um único pixel).
export function getMetaCapiToken(pixelId: string): string | undefined {
  return process.env[`META_CAPI_TOKEN_${pixelId}`] || process.env.META_CAPI_TOKEN || undefined;
}
