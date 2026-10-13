// Fixo no código (não em env) de propósito: a conta tem mais de um pixel e só este
// deve receber eventos desta LP — evita que um NEXT_PUBLIC_META_PIXEL_IDS antigo na
// Vercel volte a espalhar eventos para os outros.
export const META_PIXEL_ID = "348950488264714";

export function getMetaCapiToken(): string | undefined {
  return (
    process.env[`META_CAPI_TOKEN_${META_PIXEL_ID}`] || process.env.META_CAPI_TOKEN || undefined
  );
}
