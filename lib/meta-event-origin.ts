// Parâmetros de origem que vão em TODO evento desta LP para o pixel "ALPHA 2.0"
// (348950488264714). O pixel é compartilhado com o CRM (CAPI: Reuniao Marcada,
// Reuniao Realizada, Venda) e com campanhas de formulário da Meta. Com "origem" no
// custom_data, o Events Manager e as conversões personalizadas separam o que veio
// daqui. Mesmos nomes no CRM (Dashboard-Comercial-Back-V2, meta-capi.service.ts).
// Sem import de Node: usado no navegador (pixel) e no servidor (CAPI).

export const META_EVENT_ORIGIN = "lp-alpha-restaurante";

export type MetaEventChannel = "navegador" | "servidor";

export function metaOriginParams(canal: MetaEventChannel, pagina: string | null | undefined, variant?: string | null) {
  return {
    origem: META_EVENT_ORIGIN,
    canal,
    ...(pagina ? { pagina } : {}),
    ...(variant ? { variant } : {}),
  };
}

// Caminho sem query: o ?t= do agendamento é o token do lead, e UTM/fbclid não
// precisam ir duplicados (a Meta já recebe a URL).
export function pathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}
