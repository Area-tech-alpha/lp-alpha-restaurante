import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { agendamentoConfig } from "@/lib/agendamento-config";
import { formatSlot, isGridSlot, meetingEnd } from "@/lib/agendamento";
import { readAgendamentoToken, type LeadAgendamento } from "@/lib/agendamento-token";
import {
  EventAlreadyExistsError,
  buildMeetingTitle,
  findLeadEvent,
  getCloserEmail,
  insertEvent,
  queryFreeBusy,
} from "@/lib/google-calendar";
import { buildCrmLeadPayload, sendLeadToCrm } from "@/lib/crm";
import { buildAgendamentoWebhookPayload, sendAgendamentoWebhook } from "@/lib/agendamento-webhook";

// Sem banco: o lead vem do token (lib/agendamento-token.ts) e as travas
// ("já agendou", "horário ocupado") são checadas no Google Agenda do closer.
const bodySchema = z.object({
  token: z.string().min(1),
  start: z.iso.datetime({ offset: true }),
});

function error(code: string, status: number) {
  return NextResponse.json({ error: code }, { status });
}

function buildDescription(lead: LeadAgendamento) {
  return [
    `Nome: ${lead.nome}`,
    `E-mail: ${lead.email}`,
    `WhatsApp: ${lead.telefone}`,
    `Restaurante: ${lead.empresa}`,
    `Segmento: ${lead.segmento}`,
    `Faturamento: ${lead.faturamento}`,
    ...(lead.cnpj ? [`CNPJ: ${lead.cnpj}`] : []),
    "",
    `utm_source: ${lead.utm_source ?? "-"}`,
    `utm_medium: ${lead.utm_medium ?? "-"}`,
    `utm_campaign: ${lead.utm_campaign ?? "-"}`,
    `utm_content: ${lead.utm_content ?? "-"}`,
    `utm_term: ${lead.utm_term ?? "-"}`,
    "",
    `Lead ID: ${lead.leadKey}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("invalid_body", 400);

  const lead = readAgendamentoToken(parsed.data.token);
  if (!lead) return error("lead_not_found", 404);

  const start = new Date(parsed.data.start);
  if (!isGridSlot(start, new Date())) return error("invalid_slot", 400);
  const end = meetingEnd(start);

  const titulo = buildMeetingTitle(lead.empresa);
  let closer: string;
  let event: Awaited<ReturnType<typeof insertEvent>>;
  try {
    closer = getCloserEmail();
    if (await findLeadEvent(closer, lead.leadKey)) return error("already_scheduled", 409);

    // Rechecagem logo antes de criar: o horário pode ter sido ocupado desde que a grade carregou.
    const busy = await queryFreeBusy(closer, start, end);
    if (busy.some((b) => start < b.end && end > b.start)) return error("slot_taken", 409);

    event = await insertEvent({
      organizerEmail: closer,
      summary: titulo,
      description: buildDescription(lead),
      start,
      end,
      timezone: agendamentoConfig.timezone,
      attendee: { email: lead.email, displayName: lead.nome },
      leadKey: lead.leadKey,
      sendUpdates: agendamentoConfig.sendUpdates,
    });
  } catch (err) {
    if (err instanceof EventAlreadyExistsError) return error("already_scheduled", 409);
    console.error("[agendamento] Falha ao criar evento:", err);
    return error("calendar_unavailable", 502);
  }

  // Lead agendado nunca vai para o Growth Hub: a reunião é presa ao lead que o form
  // já criou no CRM da Matriz (ou cria o lead, se aquele envio tiver falhado).
  after(async () => {
    const result = await sendLeadToCrm(
      buildCrmLeadPayload(lead, closer, {
        scheduled_at: start.toISOString(),
        meeting_link: event.meetLink,
        google_event_id: event.id,
      })
    );
    console.log("[agendamento] Criado", { leadKey: lead.leadKey, eventId: event.id, crm: result });

    // Token emitido antes deste deploy não tem crmLeadId: cai no id do envio acima.
    const crmLeadId = lead.crmLeadId ?? (result.status === "sent" ? result.crmLeadId : undefined) ?? null;
    const payload = buildAgendamentoWebhookPayload(crmLeadId, lead.empresa, start);
    const webhook = await sendAgendamentoWebhook(payload);
    console.log("[agendamento] Webhook", { leadKey: lead.leadKey, eventId: event.id, payload, webhook });
  });

  return NextResponse.json({
    ok: true,
    inicio: start.toISOString(),
    fim: end.toISOString(),
    confirmed: formatSlot(start),
    meetLink: event.meetLink,
  });
}
