import { NextRequest, NextResponse } from "next/server";
import { erpApi, ErpApiError, type LpEventInput } from "@/lib/erp-api";

export const dynamic = "force-dynamic";

type Body = {
  sessionId: string;
  events: LpEventInput[];
  // campos opcionais enviados pelo beacon no session_end
  maxScrollDepth?: number;
  timeOnPageSec?: number;
};

// Limite do Dashcom por chamada; o tracker manda lotes bem menores.
const MAX_EVENTS = 200;

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json();
    const { sessionId, events, maxScrollDepth, timeOnPageSec } = body;

    if (!sessionId || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    await erpApi.trackEvents({
      sessionId,
      events: events.slice(0, MAX_EVENTS).map((e) => ({
        type: String(e.type).slice(0, 50),
        data: e.data && typeof e.data === "object" && !Array.isArray(e.data) ? e.data : undefined,
        ts: e.ts,
      })),
      maxScrollDepth: Number.isInteger(maxScrollDepth)
        ? Math.min(100, Math.max(0, maxScrollDepth as number))
        : undefined,
      timeOnPageSec: Number.isInteger(timeOnPageSec) ? Math.max(0, timeOnPageSec as number) : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ErpApiError && err.status === 404 ? 404 : 500;
    if (status === 500) console.error("[api/track] erro:", err);
    return NextResponse.json({ error: status === 404 ? "session_not_found" : "internal" }, { status });
  }
}
