import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { agendamentoConfig } from "@/lib/agendamento-config";
import { formatSlot, isGridSlot, meetingEnd } from "@/lib/agendamento";
import { readAgendamentoToken, type LeadAgendamento } from "@/lib/agendamento-token";
import {
  EventAlreadyExistsError,
  assertCalendarAccount,
  buildMeetingTitle,
  getAgendaOrganizer,
  insertEvent,
  isCalendarAccountError,
} from "@/lib/google-calendar";
import { bookOnAvailableAgenda, confirmAgendaSdr, findLeadEventInAgendas, type AgendaSdr } from "@/lib/sdr-queue";
import { buildCrmLeadPayload, isRetryableCrmFailure, sendLeadToCrm, sendScheduledLeadToCrm } from "@/lib/crm";
import { findLeilaoLeadEvent, isLeilaoLead, leilaoOrganizerEmail } from "@/lib/agendamento-leilao";
import { buildFormPayload } from "@/lib/agendamento-followup";
import { checkAgendamentoRateLimit, clientIp } from "@/lib/rate-limit";
import { sendMeetingScheduledToMetaCapi } from "@/lib/meta-capi";
import { erpApi } from "@/lib/erp-api";

// event_source_url sem a query: o ?t= é o token do lead e não deve ir para a Meta.
function sourceUrl(referer: string | null) {
  if (!referer) return undefined;
  try {
    const url = new URL(referer);
    return `${url.origin}${url.pathname}`;
  } catch {
    return undefined;
  }
}

// "Reuniao Agendada" para a Meta (pixel no cliente + CAPI aqui, mesmo event_id). Nunca lança.
async function sendMeetingScheduledEvent(lead: LeadAgendamento, metaEventId: string, req: NextRequest) {
  const result = await sendMeetingScheduledToMetaCapi({
    eventId: metaEventId,
    eventSourceUrl: sourceUrl(req.headers.get("referer")),
    email: lead.email,
    phone: lead.telefone,
    name: lead.nome,
    ip: clientIp(req.headers),
    userAgent: req.headers.get("user-agent"),
    fbp: lead.fbp ?? undefined,
    fbc: lead.fbc ?? undefined,
    externalId: lead.sessionId ?? undefined,
    variant: lead.variante || null,
  });
  console.log("[agendamento] Meta Reuniao Agendada", { leadKey: lead.leadKey, metaEventId, status: result.status });
  if (!lead.sessionId) return;
  await erpApi
    .trackEvent(lead.sessionId, "meta_capi_schedule", { ...result, eventId: metaEventId, leadKey: lead.leadKey })
    .catch((err) => console.error("[agendamento] Falha ao gravar log da CAPI:", err));
}

// Sem banco: o lead vem do token (lib/agendamento-token.ts) e a trava "já agendou"
// é checada no Google Agenda (findLeadEventInAgendas). A agenda é a do próximo SDR da fila
// (lib/sdr-queue.ts). Horário ocupado NÃO é checado: vários leads podem marcar o mesmo horário.
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

// Fluxo do leilão (lib/agendamento-leilao.ts): a reunião nasce na conta genérica, sem SDR, e o
// lead vai ao CRM já com ela. O Dashcom manda ao leilão do Growth Hub (ou à Matriz com um SDR da
// fila) e leva o evento para a agenda de quem ficar com o lead.
async function scheduleForAuction(
  req: NextRequest,
  lead: LeadAgendamento,
  start: Date,
  end: Date
) {
  const organizerEmail = leilaoOrganizerEmail();
  if (!organizerEmail) {
    console.error("[agendamento] AGENDA_ORGANIZER_EMAIL não definida (fluxo do leilão)");
    return error("calendar_unavailable", 502);
  }

  let event: Awaited<ReturnType<typeof insertEvent>>;
  try {
    if (await findLeilaoLeadEvent(lead.leadKey)) return error("already_scheduled", 409);
    event = await insertEvent({
      organizerEmail,
      hostEmail: null,
      summary: buildMeetingTitle(lead.empresa),
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
    console.error("[agendamento] Falha ao criar evento (leilão):", err);
    return error("calendar_unavailable", 502);
  }

  const metaEventId = `schedule:${event.id}`;
  after(() => sendMeetingScheduledEvent(lead, metaEventId, req));

  after(async () => {
    const meeting = {
      scheduled_at: start.toISOString(),
      meeting_link: event.meetLink,
      google_event_id: event.id,
    };
    // A reunião já existe: o lead não pode ficar fora do CRM. O envio é idempotente pelo id do
    // evento, então dá para repetir. Se nada passar, o Dashcom ainda manda o lead (sem a reunião)
    // como quem não agendou.
    let result = await sendScheduledLeadToCrm(buildFormPayload(lead), meeting, lead.leadKey);
    for (let attempt = 1; attempt <= 2 && isRetryableCrmFailure(result); attempt++) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      result = await sendScheduledLeadToCrm(buildFormPayload(lead), meeting, lead.leadKey);
    }
    const failed = isRetryableCrmFailure(result) || (result.status === "sent" && !result.ok);
    console[failed ? "error" : "log"]("[agendamento] Criado (leilão)", {
      leadKey: lead.leadKey,
      eventId: event.id,
      crm: result,
    });
    if (failed) return;
    await erpApi
      .updateLead(lead.leadKey, {
        webhookSentAt: new Date().toISOString(),
        webhookStatus: result.status === "sent" ? result.httpStatus : 0,
        crmLeadId: result.status === "sent" ? (result.crmLeadId ?? null) : null,
      })
      .catch(() => {});
  });

  return NextResponse.json({
    ok: true,
    inicio: start.toISOString(),
    fim: end.toISOString(),
    confirmed: formatSlot(start),
    meetLink: event.meetLink,
    metaEventId,
    variant: lead.variante || null,
  });
}

export async function POST(req: NextRequest) {
  if (!(await checkAgendamentoRateLimit(clientIp(req.headers))).ok) return error("rate_limited", 429);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("invalid_body", 400);

  const lead = readAgendamentoToken(parsed.data.token);
  if (!lead) return error("lead_not_found", 404);

  const start = new Date(parsed.data.start);
  if (!isGridSlot(start, new Date())) return error("invalid_slot", 400);
  const end = meetingEnd(start);

  if (isLeilaoLead(lead)) return scheduleForAuction(req, lead, start, end);

  let sdr: AgendaSdr;
  let event: Awaited<ReturnType<typeof insertEvent>>;
  try {
    // Antes da fila: lead que já agendou não pode girar a fila de novo.
    if (await findLeadEventInAgendas(lead.leadKey)) return error("already_scheduled", 409);

    // Agenda do SDR com erro (conta apagada/suspensa) troca de SDR em vez de derrubar o
    // agendamento (lib/sdr-queue.ts, 11/11/2026).
    const booked = await bookOnAvailableAgenda(lead, async (candidate) => {
      const input = {
        summary: buildMeetingTitle(lead.empresa),
        description: buildDescription(lead),
        start,
        end,
        timezone: agendamentoConfig.timezone,
        attendee: { email: lead.email, displayName: lead.nome },
        leadKey: lead.leadKey,
        sendUpdates: agendamentoConfig.sendUpdates,
      };
      const { organizerEmail, hostEmail } = getAgendaOrganizer(candidate.email);
      if (!hostEmail) return insertEvent({ ...input, organizerEmail, hostEmail });

      // Com a conta genérica de organizer, o SDR é só convidado: o Google aceitaria o evento
      // mesmo com a conta dele apagada. Confere antes, para a reunião não ficar sem ninguém.
      await assertCalendarAccount(hostEmail);
      try {
        return await insertEvent({ ...input, organizerEmail, hostEmail });
      } catch (err) {
        // A conta genérica é que sumiu: o evento nasce na agenda do próprio SDR.
        if (!isCalendarAccountError(err)) throw err;
        console.error("[agendamento] AGENDA_ORGANIZER_EMAIL indisponível, criando na agenda do SDR:", err);
        return insertEvent({ ...input, organizerEmail: hostEmail, hostEmail: null });
      }
    });
    sdr = booked.sdr;
    event = booked.result;
  } catch (err) {
    if (err instanceof EventAlreadyExistsError) return error("already_scheduled", 409);
    console.error("[agendamento] Falha ao criar evento:", err);
    // Nenhuma agenda aceitou (fila e agenda fixa). O SDR reservado continua do lead no retry.
    return error("calendar_unavailable", 502);
  }

  // Um por reunião criada: o id do evento no Google é único e a trava "já agendou"
  // impede um segundo evento para o mesmo lead.
  const metaEventId = `schedule:${event.id}`;
  after(() => sendMeetingScheduledEvent(lead, metaEventId, req));

  // Lead agendado nunca vai para o Growth Hub: a reunião é presa ao lead que o form
  // já criou no CRM da Matriz (ou cria o lead, se aquele envio tiver falhado).
  after(async () => {
    const result = await sendLeadToCrm(
      buildCrmLeadPayload(lead, sdr.email, {
        scheduled_at: start.toISOString(),
        meeting_link: event.meetLink,
        google_event_id: event.id,
      })
    );
    console.log("[agendamento] Criado", { leadKey: lead.leadKey, eventId: event.id, crm: result });

    // Token emitido antes deste deploy não tem crmLeadId: cai no id do envio acima.
    const crmLeadId = lead.crmLeadId ?? (result.status === "sent" ? result.crmLeadId : undefined) ?? null;
    await confirmAgendaSdr(sdr, lead.leadKey, {
      googleEventId: event.id,
      meetingAt: start.toISOString(),
      crmLeadId,
    });
  });

  return NextResponse.json({
    ok: true,
    inicio: start.toISOString(),
    fim: end.toISOString(),
    confirmed: formatSlot(start),
    meetLink: event.meetLink,
    metaEventId,
    variant: lead.variante || null,
  });
}
