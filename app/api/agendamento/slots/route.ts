import { NextRequest, NextResponse } from "next/server";
import { agendamentoConfig } from "@/lib/agendamento-config";
import { buildAgenda, formatSlot } from "@/lib/agendamento";
import { readAgendamentoToken } from "@/lib/agendamento-token";
import { findLeadEvent, getAgendaOrganizer } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const lead = readAgendamentoToken(req.nextUrl.searchParams.get("t") ?? "");
  if (!lead) return NextResponse.json({ error: "lead_not_found" }, { status: 404 });

  try {
    const existing = await findLeadEvent(getAgendaOrganizer().organizerEmail, lead.leadKey);
    if (existing) {
      return NextResponse.json({ alreadyScheduled: true, confirmed: formatSlot(existing.start) });
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
