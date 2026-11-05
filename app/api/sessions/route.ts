import { NextRequest, NextResponse } from "next/server";
import { erpApi } from "@/lib/erp-api";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Limites das colunas de lp_sessions: um UTM gigante não pode custar a sessão inteira (400).
function cut(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value ? value.slice(0, max) : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = typeof body.id === "string" && UUID_RE.test(body.id) ? body.id : undefined;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      null;

    // Sessão existente: o Dashcom renova lastSeenAt e completa UTM/fbclid (first-touch).
    const { sessionId } = await erpApi.upsertSession({
      id,
      landingUrl: cut(body.landingUrl, 2048),
      referrer: cut(body.referrer, 2048),
      utmSource: cut(body.utmSource, 255),
      utmMedium: cut(body.utmMedium, 255),
      utmCampaign: cut(body.utmCampaign, 255),
      utmContent: cut(body.utmContent, 255),
      utmTerm: cut(body.utmTerm, 255),
      deviceType: cut(body.deviceType, 20),
      fbclid: cut(body.fbclid, 512),
      ipAddress: ip?.slice(0, 64) ?? null,
      userAgent: req.headers.get("user-agent")?.slice(0, 1024) ?? null,
    });

    return NextResponse.json({ sessionId });
  } catch (err) {
    console.error("[api/sessions] erro:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
