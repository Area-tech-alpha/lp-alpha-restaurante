import { Client } from "@upstash/qstash";
import type { LeadAgendamento } from "@/lib/agendamento-token";

// Lead qualificado da variação com agendamento que não marcou reunião em 5 min
// vai para o comercial. O submit-lead agenda uma checagem no QStash e
// app/api/agendamento/followup decide se envia.

export const FOLLOWUP_DELAY_SECONDS = 300;

// Best-effort: sem env ou com erro, só loga — nunca quebra o envio do form.
export async function scheduleAgendamentoFollowup(token: string) {
  const qstashToken = process.env.QSTASH_TOKEN;
  const siteUrl = process.env.SITE_URL;
  if (!qstashToken || !siteUrl) {
    console.error("[agendamento-followup] QSTASH_TOKEN / SITE_URL não definidas");
    return;
  }
  try {
    const { messageId } = await new Client({ token: qstashToken }).publishJSON({
      url: `${siteUrl.replace(/\/+$/, "")}/api/agendamento/followup`,
      body: { token },
      delay: FOLLOWUP_DELAY_SECONDS,
    });
    console.log("[agendamento-followup] Checagem agendada", { messageId });
  } catch (err) {
    console.error("[agendamento-followup] Falha ao agendar no QStash:", err);
  }
}

// Mesmo formato do payload que o submit-lead manda ao CRM_WEBHOOK_URL.
export function buildComercialPayload(lead: LeadAgendamento) {
  return {
    lead_id: lead.leadKey,
    nome: lead.nome,
    email: lead.email,
    telefone: lead.telefone,
    empresa: lead.empresa,
    segmento: lead.segmento,
    faturamento: lead.faturamento,
    cnpj: lead.cnpj,
    investiria: lead.investiria,
    origem: "alpha-restaurante",
    variante: lead.variante || null,
    utm_source: lead.utm_source,
    utm_medium: lead.utm_medium,
    utm_campaign: lead.utm_campaign,
    utm_content: lead.utm_content,
    utm_term: lead.utm_term,
    referrer: lead.referrer,
    fbclid: lead.fbclid,
    fbc: lead.fbc,
    fbp: lead.fbp,
    crm_lead_id: lead.crmLeadId ?? null,
    motivo: "nao_agendou_5min",
  };
}

export type ComercialWebhookResult =
  | { status: "sent"; httpStatus: number; ok: boolean }
  | { status: "skipped" | "error"; error: string };

export async function sendLeadToComercial(
  payload: ReturnType<typeof buildComercialPayload>
): Promise<ComercialWebhookResult> {
  const url = process.env.COMERCIAL_WEBHOOK_URL;
  if (!url) {
    console.error("[agendamento-followup] COMERCIAL_WEBHOOK_URL não definida");
    return { status: "skipped", error: "webhook_not_configured" };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error(`[agendamento-followup] Webhook comercial retornou ${res.status}`);
    return { status: "sent", httpStatus: res.status, ok: res.ok };
  } catch (err) {
    console.error("[agendamento-followup] Erro de rede no webhook comercial:", err);
    return { status: "error", error: String(err).slice(0, 500) };
  }
}
