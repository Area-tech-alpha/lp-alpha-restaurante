import { NextRequest, NextResponse } from "next/server";
import { agendamentoConfig } from "@/lib/agendamento-config";
import { buildAgenda, formatSlot, lookaheadWindow } from "@/lib/agendamento";
import { readAgendamentoToken } from "@/lib/agendamento-token";
import { findLeadEvent, getCloserEmail, queryFreeBusy } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const lead = readAgendamentoToken(req.nextUrl.searchParams.get("t") ?? "");
  if (!lead) return NextResponse.json({ error: "lead_not_found" }, { status: 404 });

  try {
    const closer = getCloserEmail();
    const existing = await findLeadEvent(closer, lead.leadKey);
    if (existing) {
      return NextResponse.json({ alreadyScheduled: true, confirmed: formatSlot(existing.start) });
    }

    const now = new Date();
    const { timeMin, timeMax } = lookaheadWindow(now);
    const busy = await queryFreeBusy(closer, timeMin, timeMax);

    return NextResponse.json(
      { timezone: agendamentoConfig.timezone, days: buildAgenda(now, busy) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[agendamento/slots] Falha ao consultar agenda:", err);
    return NextResponse.json({ error: "calendar_unavailable" }, { status: 503 });
  }
}
