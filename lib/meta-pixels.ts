// Fixo no código (não em env) de propósito: a conta tem mais de um pixel e só este
// deve receber eventos desta LP — evita que um NEXT_PUBLIC_META_PIXEL_IDS antigo na
// Vercel volte a espalhar eventos para os outros.
export const META_PIXEL_ID = "348950488264714";

export type CapiTokenInfo = {
  source: string;
  length: number;
  startsWithEAA: boolean;
  wasSanitized: boolean;
};

// Token colado na Vercel com espaço, quebra de linha ou aspas faz o Meta responder
// "Cannot parse access token". Limpa isso e devolve um diagnóstico (sem o token)
// para o log do dashboard mostrar o que veio de errado.
export function getMetaCapiToken(): { token: string; info: CapiTokenInfo } | undefined {
  const specificKey = `META_CAPI_TOKEN_${META_PIXEL_ID}`;
  const source = process.env[specificKey] ? specificKey : "META_CAPI_TOKEN";
  const raw = process.env[source];
  if (!raw) return undefined;

  const token = raw.trim().replace(/^["']|["']$/g, "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return undefined;

  return {
    token,
    info: {
      source,
      length: token.length,
      startsWithEAA: token.startsWith("EAA"),
      wasSanitized: token !== raw,
    },
  };
}
