import type { LeadAgendamento } from "@/lib/agendamento-token";

export type AgendamentoInfo = {
  inicio: string;
  fim: string;
  timezone: string;
  closer_email: string;
  google_event_id: string;
  meet_link: string | null;
  titulo: string;
};

// Formato acordado com o Growth Hub. Isolado aqui porque ainda pode mudar; os
// campos do lead espelham o payload do CRM em app/actions/submit-lead.ts.
export function buildGrowthHubPayload(lead: LeadAgendamento, agendamento: AgendamentoInfo) {
  const { leadKey, ...dados } = lead;
  return {
    lead_id: leadKey,
    ...dados,
    origem: "alpha-restaurante",
    agendamento,
  };
}

export type GrowthHubResult =
  | { status: "skipped"; reason: "no_url" }
  | { status: "sent"; httpStatus: number; ok: boolean; error?: string }
  | { status: "error"; error: string };

export async function sendToGrowthHub(payload: ReturnType<typeof buildGrowthHubPayload>): Promise<GrowthHubResult> {
  const url = process.env.GROWTH_HUB_WEBHOOK_URL;
  if (!url) {
    console.warn("[growth-hub] GROWTH_HUB_WEBHOOK_URL não definida — envio ignorado");
    return { status: "skipped", reason: "no_url" };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = (await res.text().catch(() => "")).slice(0, 500);
      console.error(`[growth-hub] Webhook retornou ${res.status}`);
      return { status: "sent", httpStatus: res.status, ok: false, error };
    }
    return { status: "sent", httpStatus: res.status, ok: true };
  } catch (err) {
    console.error("[growth-hub] Erro de rede:", err);
    return { status: "error", error: String(err).slice(0, 500) };
  }
}
