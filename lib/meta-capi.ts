import { createHash } from "node:crypto";
import { getMetaCapiToken, getMetaPixelIds } from "@/lib/meta-pixels";

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
  qualified: boolean;
};

// Best-effort: nunca lança. Chamado dentro de after() para não atrasar a resposta
// do formulário. O eventId deve ser o mesmo passado ao fbq no cliente — é ele que
// permite ao Meta deduplicar o evento do pixel com o do servidor.
export async function sendLeadToMetaCapi(input: CapiLeadInput): Promise<void> {
  await Promise.all(
    getMetaPixelIds().map((pixelId) => {
      const token = getMetaCapiToken(pixelId);
      return token ? sendToPixel(pixelId, token, input) : undefined;
    })
  );
}

async function sendToPixel(pixelId: string, token: string, input: CapiLeadInput) {
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
        custom_data: { qualified: input.qualified },
      },
    ],
  };

  const testCode = process.env.META_CAPI_TEST_EVENT_CODE;
  if (testCode) body.test_event_code = testCode;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      console.error(`[meta-capi:${pixelId}] HTTP ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error(`[meta-capi:${pixelId}] Erro de rede:`, err);
  }
}
