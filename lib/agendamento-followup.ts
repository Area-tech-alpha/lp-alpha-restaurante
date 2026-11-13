import { Client } from "@upstash/qstash";
import type { LeadAgendamento } from "@/lib/agendamento-token";

// Lead qualificado da variação com agendamento que não marcou reunião em 5 min
// vai para o comercial. O submit-lead agenda uma checagem no QStash e
// app/api/agendamento/followup decide se envia.

export const FOLLOWUP_DELAY_SECONDS = 300;

// Reunião já criada cujo envio ao CRM falhou: o follow-up reenvia até o CRM aceitar.
export type ScheduledRetry = { scheduled_at: string; meeting_link: string | null; google_event_id: string };

async function publishFollowup(body: Record<string, unknown>, delay: number) {
  const qstashToken = process.env.QSTASH_TOKEN;
  const siteUrl = process.env.SITE_URL;
  if (!qstashToken || !siteUrl) {
    console.error("[agendamento-followup] QSTASH_TOKEN / SITE_URL não definidas");
    return false;
  }
  try {
    const { messageId } = await new Client({ token: qstashToken }).publishJSON({
      url: `${siteUrl.replace(/\/+$/, "")}/api/agendamento/followup`,
      body,
      delay,
    });
    console.log("[agendamento-followup] Checagem agendada", { messageId });
    return true;
  } catch (err) {
    console.error("[agendamento-followup] Falha ao agendar no QStash:", err);
    return false;
  }
}

// Sem env ou com erro, só loga e devolve false: nunca quebra o envio do form. No fluxo do leilão
// quem chama usa o false para mandar o lead ao CRM na hora (ele não foi enviado no form).
export function scheduleAgendamentoFollowup(token: string) {
  return publishFollowup({ token }, FOLLOWUP_DELAY_SECONDS);
}

// Fluxo do leilão: a reunião existe no Google mas o CRM não recebeu o lead. O QStash chama o
// follow-up, que reenvia e devolve 5xx enquanto o CRM não aceitar (o QStash repete).
export function scheduleScheduledLeadRetry(token: string, scheduled: ScheduledRetry) {
  return publishFollowup({ token, scheduled }, 30);
}

// Formulário do lead como o intake de LP do CRM espera (POST /external/leads/lp e /lp/scheduled).
export function buildFormPayload(lead: LeadAgendamento) {
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
  };
}

// Mesmo formato do payload que o submit-lead manda ao intake de LP do CRM.
export function buildComercialPayload(lead: LeadAgendamento) {
  return {
    ...buildFormPayload(lead),
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
