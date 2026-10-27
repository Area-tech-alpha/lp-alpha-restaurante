import { NextRequest, NextResponse, after } from "next/server";
import { Prisma, type Lead } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { agendamentoConfig } from "@/lib/agendamento-config";
import { formatSlot, isGridSlot, meetingEnd } from "@/lib/agendamento";
import {
  buildMeetingTitle,
  getCloserEmail,
  insertEvent,
  queryFreeBusy,
} from "@/lib/google-calendar";
import { buildGrowthHubPayload, sendToGrowthHub } from "@/lib/growth-hub";
import { hasAgendamento, variantFromUrl } from "@/lib/variants";

const bodySchema = z.object({
  leadId: z.uuid(),
  start: z.iso.datetime({ offset: true }),
  variant: z.string().optional(),
});

function error(code: string, status: number) {
  return NextResponse.json({ error: code }, { status });
}

function buildDescription(lead: Lead) {
  return [
    `Nome: ${lead.nome}`,
    `E-mail: ${lead.email}`,
    `WhatsApp: ${lead.telefone}`,
    `Restaurante: ${lead.empresa}`,
    `Segmento: ${lead.segmento}`,
    `Faturamento: ${lead.faturamento}`,
    ...(lead.cnpj ? [`CNPJ: ${lead.cnpj}`] : []),
    "",
    `utm_source: ${lead.utmSource ?? "-"}`,
    `utm_medium: ${lead.utmMedium ?? "-"}`,
    `utm_campaign: ${lead.utmCampaign ?? "-"}`,
    `utm_content: ${lead.utmContent ?? "-"}`,
    `utm_term: ${lead.utmTerm ?? "-"}`,
    "",
    `Lead ID: ${lead.id}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("invalid_body", 400);

  const start = new Date(parsed.data.start);
  const now = new Date();
  if (!isGridSlot(start, now)) return error("invalid_slot", 400);
  const end = meetingEnd(start);

  const lead = await db.lead
    .findUnique({
      where: { id: parsed.data.leadId },
      include: { session: { select: { landingUrl: true } } },
    })
    .catch((err) => {
      console.error("[agendamento] Falha ao buscar lead:", err);
      return undefined;
    });
  if (lead === undefined) return error("db_unavailable", 503);
  if (!lead) return error("lead_not_found", 404);
  if (lead.agendadoPara) return error("already_scheduled", 409);

  let closer: string;
  try {
    closer = getCloserEmail();
  } catch (err) {
    console.error("[agendamento]", err);
    return error("calendar_unavailable", 503);
  }

  // Reserva o horário no banco antes de falar com o Google: o updateMany
  // condicional barra o mesmo lead em duplo clique, e o índice único
  // (closerEmail, agendadoPara) barra dois leads no mesmo horário.
  try {
    const claim = await db.lead.updateMany({
      where: { id: lead.id, agendadoPara: null },
      data: { agendadoPara: start, closerEmail: closer },
    });
    if (claim.count === 0) return error("already_scheduled", 409);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return error("slot_taken", 409);
    }
    throw err;
  }

  const release = () =>
    db.lead
      .update({ where: { id: lead.id }, data: { agendadoPara: null, closerEmail: null } })
      .catch((err) => console.error("[agendamento] Falha ao liberar reserva:", err));

  const titulo = buildMeetingTitle(lead.empresa);
  let event: Awaited<ReturnType<typeof insertEvent>>;
  try {
    // Rechecagem logo antes de criar: alguém pode ter marcado direto na agenda do closer.
    const busy = await queryFreeBusy(closer, start, end);
    if (busy.some((b) => start < b.end && end > b.start)) {
      await release();
      return error("slot_taken", 409);
    }

    event = await insertEvent({
      organizerEmail: closer,
      summary: titulo,
      description: buildDescription(lead),
      start,
      end,
      timezone: agendamentoConfig.timezone,
      attendee: { email: lead.email, displayName: lead.nome },
      requestId: `lead-${lead.id}`,
      sendUpdates: agendamentoConfig.sendUpdates,
    });
  } catch (err) {
    console.error("[agendamento] Falha ao criar evento:", err);
    await release();
    return error("calendar_unavailable", 502);
  }

  const agendamentoCriadoEm = new Date();
  await db.lead
    .update({ where: { id: lead.id }, data: { googleEventId: event.id, agendamentoCriadoEm } })
    .catch((err) => console.error("[agendamento] Evento criado mas falhou ao salvar no lead:", err));

  const variante =
    (parsed.data.variant && hasAgendamento(parsed.data.variant) ? parsed.data.variant : null) ??
    variantFromUrl(lead.session?.landingUrl) ??
    "";

  after(async () => {
    const payload = buildGrowthHubPayload(lead, variante, {
      inicio: start.toISOString(),
      fim: end.toISOString(),
      timezone: agendamentoConfig.timezone,
      closer_email: closer,
      google_event_id: event.id,
      meet_link: event.meetLink,
      titulo,
    });
    const result = await sendToGrowthHub(payload);
    if (result.status === "sent") {
      await db.lead
        .update({
          where: { id: lead.id },
          data: { growthHubSentAt: new Date(), growthHubStatus: result.httpStatus },
        })
        .catch(() => {});
    }
    if (lead.sessionId) {
      await db.event
        .createMany({
          data: [
            {
              sessionId: lead.sessionId,
              type: "agendamento_criado",
              data: { leadId: lead.id, inicio: start.toISOString(), googleEventId: event.id },
            },
            { sessionId: lead.sessionId, type: "growth_hub_webhook", data: { leadId: lead.id, ...result } },
          ],
        })
        .catch((err) => console.error("[agendamento] Falha ao gravar eventos:", err));
    }
  });

  return NextResponse.json({
    ok: true,
    inicio: start.toISOString(),
    fim: end.toISOString(),
    confirmed: formatSlot(start),
    meetLink: event.meetLink,
  });
}
