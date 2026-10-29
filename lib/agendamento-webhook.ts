import { agendamentoConfig } from "@/lib/agendamento-config";

// Webhook n8n disparado depois que a reunião é criada no Google Agenda (lp-09).
// Best-effort: sem URL ou com erro, só loga — nunca afeta a resposta ao lead.

export type AgendamentoWebhookResult =
  | { status: "sent"; httpStatus: number; ok: boolean }
  | { status: "skipped" | "error"; error: string };

// "2026-10-30T14:30:00-03:00" no fuso do agendamento, não em UTC.
function formatMeeting(start: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: agendamentoConfig.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "longOffset",
    })
      .formatToParts(start)
      .map((p) => [p.type, p.value])
  );
  // longOffset vem "GMT-03:00" (ou só "GMT" quando o offset é zero).
  const offset = parts.timeZoneName.replace("GMT", "") || "+00:00";
  return {
    data_hora_reuniao: `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`,
    data_reuniao: `${parts.day}/${parts.month}/${parts.year}`,
    hora_reuniao: `${parts.hour}:${parts.minute}`,
  };
}

export function buildAgendamentoWebhookPayload(crmLeadId: string | null, empresa: string, start: Date) {
  return { crm_lead_id: crmLeadId, nome_empresa: empresa, ...formatMeeting(start) };
}

export async function sendAgendamentoWebhook(
  payload: ReturnType<typeof buildAgendamentoWebhookPayload>
): Promise<AgendamentoWebhookResult> {
  const url = process.env.AGENDAMENTO_WEBHOOK_URL;
  if (!url) {
    console.error("[agendamento-webhook] AGENDAMENTO_WEBHOOK_URL não definida");
    return { status: "skipped", error: "webhook_not_configured" };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error(`[agendamento-webhook] Webhook retornou ${res.status}`);
    return { status: "sent", httpStatus: res.status, ok: res.ok };
  } catch (err) {
    console.error("[agendamento-webhook] Erro de rede:", err);
    return { status: "error", error: String(err).slice(0, 500) };
  }
}
