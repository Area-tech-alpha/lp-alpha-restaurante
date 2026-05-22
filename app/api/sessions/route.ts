import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      landingUrl,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      deviceType,
    } = body as {
      id?: string;
      landingUrl?: string;
      referrer?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmContent?: string;
      utmTerm?: string;
      deviceType?: string;
    };

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const userAgent = req.headers.get("user-agent") ?? null;

    // Se sessão já existe (reload ou retorno), só atualiza lastSeenAt
    if (id) {
      const existing = await db.session.findUnique({ where: { id } });
      if (existing) {
        await db.session.update({ where: { id }, data: { lastSeenAt: new Date() } });
        return NextResponse.json({ sessionId: id });
      }
    }

    const session = await db.session.create({
      data: {
        ...(id ? { id } : {}),
        ipAddress: ip,
        userAgent,
        referrer: referrer ?? null,
        landingUrl: landingUrl ?? null,
        utmSource: utmSource ?? null,
        utmMedium: utmMedium ?? null,
        utmCampaign: utmCampaign ?? null,
        utmContent: utmContent ?? null,
        utmTerm: utmTerm ?? null,
        deviceType: deviceType ?? null,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error("[api/sessions] erro:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
