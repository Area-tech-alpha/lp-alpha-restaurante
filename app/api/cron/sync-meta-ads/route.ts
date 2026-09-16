import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fetchMetaAdClicks } from "@/lib/meta-ads"

export const dynamic = "force-dynamic"

const SP_OFFSET_MS = 3 * 60 * 60 * 1000

function dateSaoPaulo(daysAgo: number): string {
  const spLocal = new Date(Date.now() - SP_OFFSET_MS)
  spLocal.setUTCDate(spLocal.getUTCDate() - daysAgo)
  return spLocal.toISOString().slice(0, 10)
}

// Vercel Cron injeta esse header automaticamente quando CRON_SECRET está
// definido nas env vars do projeto — ver vercel.json.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // Reprocessa os últimos 3 dias, não só ontem: a Meta ainda ajusta os
  // números de clique por alguns dias após o evento (janela de atribuição).
  const since = dateSaoPaulo(2)
  const until = dateSaoPaulo(0)

  try {
    const rows = await fetchMetaAdClicks(since, until)

    for (const row of rows) {
      await db.adClick.upsert({
        where: {
          date_platform_campaign: {
            date: new Date(`${row.date}T00:00:00.000Z`),
            platform: "meta",
            campaign: row.campaignId,
          },
        },
        update: { clicks: row.clicks, campaignName: row.campaignName },
        create: {
          date: new Date(`${row.date}T00:00:00.000Z`),
          platform: "meta",
          campaign: row.campaignId,
          campaignName: row.campaignName,
          clicks: row.clicks,
        },
      })
    }

    return NextResponse.json({ synced: rows.length })
  } catch (err) {
    console.error("[cron/sync-meta-ads] erro:", err)
    return NextResponse.json({ error: "sync_failed" }, { status: 500 })
  }
}
