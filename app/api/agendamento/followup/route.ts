import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { z } from "zod";
import { readAgendamentoToken } from "@/lib/agendamento-token";
import { findLeadEventInAgendas } from "@/lib/sdr-queue";
import { buildComercialPayload, buildFormPayload, sendLeadToComercial } from "@/lib/agendamento-followup";
import { findLeilaoLeadEvent, isLeilaoLead } from "@/lib/agendamento-leilao";
import { isRetryableCrmFailure, sendFormLeadToCrm, sendScheduledLeadToCrm } from "@/lib/crm";

// Chamado pelo QStash 5 min depois do envio do form (lib/agendamento-followup.ts).
// QStash repete em qualquer resposta não-2xx: só a falha no Google devolve 5xx.
// `scheduled`: reunião do fluxo do leilão cujo envio ao CRM falhou (reenvio).
const bodySchema = z.object({
  token: z.string().min(1),
  scheduled: z
    .object({
      scheduled_at: z.string().min(1),
      meeting_link: z.string().nullable(),
      google_event_id: z.string().min(1),
    })
    .optional(),
});

async function verifySignature(req: NextRequest, body: string) {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  const signature = req.headers.get("upstash-signature");
  if (!currentSigningKey || !nextSigningKey) {
    console.error("[agendamento/followup] QSTASH_CURRENT_SIGNING_KEY / QSTASH_NEXT_SIGNING_KEY não definidas");
    return false;
  }
  if (!signature) return false;
  try {
    return await new Receiver({ currentSigningKey, nextSigningKey }).verify({ signature, body });
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!(await verifySignature(req, raw))) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let json: unknown = null;
  try {
    json = JSON.parse(raw);
  } catch {}
  const parsed = bodySchema.safeParse(json);
  const lead = parsed.success ? readAgendamentoToken(parsed.data.token) : null;
  if (!lead) {
    // Token inválido/expirado não melhora com retry.
    console.error("[agendamento/followup] Lead não encontrado no token");
    return NextResponse.json({ ok: true, action: "lead_not_found" });
  }

  // Fluxo do leilão (lib/agendamento-leilao.ts): o lead ainda não foi ao CRM. 5xx faz o QStash
  // repetir até o CRM aceitar.
  if (isLeilaoLead(lead)) {
    const scheduled = parsed.success ? parsed.data.scheduled : undefined;
    if (scheduled) {
      const result = await sendScheduledLeadToCrm(buildFormPayload(lead), scheduled, lead.leadKey);
      console.log("[agendamento/followup] Reenvio do lead agendado ao CRM", { leadKey: lead.leadKey, result });
      if (isRetryableCrmFailure(result)) return NextResponse.json({ error: "crm_unavailable" }, { status: 503 });
      return NextResponse.json({ ok: true, action: "scheduled_resent" });
    }

    try {
      if (await findLeilaoLeadEvent(lead.leadKey)) {
        return NextResponse.json({ ok: true, action: "scheduled" });
      }
    } catch (err) {
      console.error("[agendamento/followup] Falha ao consultar agenda (leilão):", err);
      return NextResponse.json({ error: "calendar_unavailable" }, { status: 503 });
    }

    // Não agendou em 5 min: segue o caminho normal das outras LPs (Matriz, leilão comum ou
    // oportunidade, decidido pelo Dashcom).
    const result = await sendFormLeadToCrm(buildFormPayload(lead));
    console.log("[agendamento/followup] Lead não agendou, enviado ao intake de LP", { leadKey: lead.leadKey, result });
    if (isRetryableCrmFailure(result)) return NextResponse.json({ error: "crm_unavailable" }, { status: 503 });
    await sendLeadToComercial(buildComercialPayload(lead));
    return NextResponse.json({ ok: true, action: "sent_to_lp_intake" });
  }

  try {
    if (await findLeadEventInAgendas(lead.leadKey)) {
      console.log("[agendamento/followup] Lead agendou, não envia ao comercial", { leadKey: lead.leadKey });
      return NextResponse.json({ ok: true, action: "scheduled" });
    }
  } catch (err) {
    console.error("[agendamento/followup] Falha ao consultar agenda:", err);
    return NextResponse.json({ error: "calendar_unavailable" }, { status: 503 });
  }

  const result = await sendLeadToComercial(buildComercialPayload(lead));
  console.log("[agendamento/followup] Lead não agendou, enviado ao comercial", { leadKey: lead.leadKey, result });
  return NextResponse.json({ ok: true, action: "sent_to_comercial" });
}
