import { createHash } from "node:crypto";
import { getMetaCapiToken, META_PIXEL_ID } from "@/lib/meta-pixels";

const GRAPH_API_VERSION = "v21.0";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalize(value: string | undefined) {
  const v = value?.trim().toLowerCase();
  return v ? v : undefined;
}

export type CapiLeadInput = {
  eventId: string;
  eventSourceUrl?: string;
  email: string;
  phone: string;
  name: string;
  ip: string | null;
  userAgent: string | null;
  fbp?: string;
  fbc?: string;
  externalId?: string;
  variant?: string | null;
};

export type CapiResult = {
  status: "sent" | "error" | "no_token";
  httpStatus?: number;
  eventsReceived?: number;
  fbtraceId?: string;
  error?: string;
  testEventCode?: string;
  hasFbp: boolean;
  hasFbc: boolean;
  durationMs?: number;
};

// Nunca lança. Chamado dentro de after() para não atrasar a resposta do formulário,
// e só para leads qualificados. O eventId deve ser o mesmo passado ao fbq no cliente
// — é ele que permite ao Meta deduplicar pixel e servidor. O retorno é gravado como
// evento "meta_capi_lead" para auditoria no dashboard.
export async function sendLeadToMetaCapi(input: CapiLeadInput): Promise<CapiResult> {
  const base = { hasFbp: !!input.fbp, hasFbc: !!input.fbc };
  const token = getMetaCapiToken();
  if (!token) {
    console.warn("[meta-capi] META_CAPI_TOKEN não definido — Lead não enviado pelo servidor");
    return { ...base, status: "no_token" };
  }
  const pixelId = META_PIXEL_ID;
  const [firstName, ...rest] = input.name.trim().split(/\s+/);
  const lastName = rest.length ? rest[rest.length - 1] : undefined;
  const email = normalize(input.email);
  const phone = input.phone.replace(/\D/g, "");

  const userData: Record<string, unknown> = {
    em: email ? [sha256(email)] : undefined,
    ph: phone ? [sha256(phone)] : undefined,
    fn: normalize(firstName) ? [sha256(normalize(firstName)!)] : undefined,
    ln: normalize(lastName) ? [sha256(normalize(lastName)!)] : undefined,
    external_id: input.externalId ? [sha256(input.externalId)] : undefined,
    client_ip_address: input.ip ?? undefined,
    client_user_agent: input.userAgent ?? undefined,
    fbp: input.fbp,
    fbc: input.fbc,
  };

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.eventSourceUrl,
        user_data: userData,
        custom_data: { variant: input.variant ?? undefined },
      },
    ],
  };

  // Com test_event_code o Meta só mostra o evento na aba "Testar eventos" — ele não
  // conta para os anúncios. Registrado no log justamente para flagrar isso em produção.
  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE || undefined;
  if (testEventCode) body.test_event_code = testEventCode;

  const startedAt = Date.now();
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const json = (await res.json().catch(() => ({}))) as {
      events_received?: number;
      fbtrace_id?: string;
      error?: { message?: string; fbtrace_id?: string };
    };
    const result: CapiResult = {
      ...base,
      status: res.ok ? "sent" : "error",
      httpStatus: res.status,
      eventsReceived: json.events_received,
      fbtraceId: json.fbtrace_id ?? json.error?.fbtrace_id,
      error: json.error?.message,
      testEventCode,
      durationMs: Date.now() - startedAt,
    };
    if (res.ok) {
      console.info(`[meta-capi:${pixelId}] Lead ${input.eventId} recebido`, result);
    } else {
      console.error(`[meta-capi:${pixelId}] Lead ${input.eventId} HTTP ${res.status}`, result);
    }
    return result;
  } catch (err) {
    console.error(`[meta-capi:${pixelId}] Erro de rede:`, err);
    return {
      ...base,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      testEventCode,
      durationMs: Date.now() - startedAt,
    };
  }
}
