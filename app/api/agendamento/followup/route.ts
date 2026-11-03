import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { z } from "zod";
import { readAgendamentoToken } from "@/lib/agendamento-token";
import { findLeadEvent, getAgendaOrganizer } from "@/lib/google-calendar";
import { buildComercialPayload, sendLeadToComercial } from "@/lib/agendamento-followup";

// Chamado pelo QStash 5 min depois do envio do form (lib/agendamento-followup.ts).
// QStash repete em qualquer resposta não-2xx: só a falha no Google devolve 5xx.
const bodySchema = z.object({ token: z.string().min(1) });

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

  try {
    if (await findLeadEvent(getAgendaOrganizer().organizerEmail, lead.leadKey)) {
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
