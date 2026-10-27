import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { agendamentoConfig } from "@/lib/agendamento-config";
import { buildAgenda, formatSlot, lookaheadWindow, meetingEnd } from "@/lib/agendamento";
import { getCloserEmail, queryFreeBusy } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const leadId = z.uuid().safeParse(req.nextUrl.searchParams.get("lead"));
  if (!leadId.success) {
    return NextResponse.json({ error: "lead_invalid" }, { status: 400 });
  }

  try {
    const lead = await db.lead.findUnique({
      where: { id: leadId.data },
      select: { agendadoPara: true },
    });
    if (!lead) return NextResponse.json({ error: "lead_not_found" }, { status: 404 });

    if (lead.agendadoPara) {
      return NextResponse.json({ alreadyScheduled: true, confirmed: formatSlot(lead.agendadoPara) });
    }

    const closer = getCloserEmail();
    const now = new Date();
    const { timeMin, timeMax } = lookaheadWindow(now);
    const [calendarBusy, claimed] = await Promise.all([
      queryFreeBusy(closer, timeMin, timeMax),
      // Horários já reservados no banco mas cujo evento ainda está sendo criado.
      db.lead.findMany({
        where: { closerEmail: closer, agendadoPara: { gte: timeMin, lt: timeMax } },
        select: { agendadoPara: true },
      }),
    ]);
    const busy = [
      ...calendarBusy,
      ...claimed.map(({ agendadoPara }) => ({ start: agendadoPara!, end: meetingEnd(agendadoPara!) })),
    ];

    return NextResponse.json(
      { timezone: agendamentoConfig.timezone, days: buildAgenda(now, busy) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[agendamento/slots] Falha ao consultar lead/agenda:", err);
    return NextResponse.json({ error: "calendar_unavailable" }, { status: 503 });
  }
}
