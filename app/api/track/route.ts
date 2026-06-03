import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type EventInput = {
  type: string;
  data?: Record<string, unknown>;
  ts?: string;
};

type Body = {
  sessionId: string;
  events: EventInput[];
  // campos opcionais enviados pelo beacon no session_end
  maxScrollDepth?: number;
  timeOnPageSec?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json();
    const { sessionId, events, maxScrollDepth, timeOnPageSec } = body;

    if (!sessionId || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const hasSessionEnd = events.some((e) => e.type === "session_end");

    await db.event.createMany({
      data: events.map((e) => ({
        sessionId,
        type: e.type,
        data: e.data != null ? (e.data as Prisma.InputJsonValue) : Prisma.JsonNull,
        ts: e.ts ? new Date(e.ts) : new Date(),
      })),
      skipDuplicates: true,
    });

    if (hasSessionEnd && (maxScrollDepth !== undefined || timeOnPageSec !== undefined)) {
      await db.session.update({
        where: { id: sessionId },
        data: {
          ...(maxScrollDepth !== undefined ? { maxScrollDepth } : {}),
          ...(timeOnPageSec !== undefined ? { timeOnPageSec } : {}),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/track] erro:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
