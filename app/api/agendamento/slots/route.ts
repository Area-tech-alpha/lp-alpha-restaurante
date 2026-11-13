import { NextRequest, NextResponse } from "next/server";
import { agendamentoConfig } from "@/lib/agendamento-config";
import { buildAgenda, formatSlot } from "@/lib/agendamento";
import { readAgendamentoToken } from "@/lib/agendamento-token";
import { findLeadEventInAgendas } from "@/lib/sdr-queue";
import { findLeilaoLeadEvent, isLeilaoLead } from "@/lib/agendamento-leilao";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const lead = readAgendamentoToken(req.nextUrl.searchParams.get("t") ?? "");
  if (!lead) return NextResponse.json({ error: "lead_not_found" }, { status: 404 });

  try {
    const existing = isLeilaoLead(lead)
      ? await findLeilaoLeadEvent(lead.leadKey)
      : await findLeadEventInAgendas(lead.leadKey);
    if (existing) {
      // `start` null: reunião do fluxo do leilão que já saiu da conta genérica sem o horário.
      return NextResponse.json({
        alreadyScheduled: true,
        confirmed: existing.start ? formatSlot(existing.start) : null,
      });
    }

    return NextResponse.json(
      { timezone: agendamentoConfig.timezone, days: buildAgenda(new Date()) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[agendamento/slots] Falha ao consultar agenda:", err);
    return NextResponse.json({ error: "calendar_unavailable" }, { status: 503 });
  }
}
