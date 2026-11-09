import { NextRequest, NextResponse } from "next/server"
import { erpApi } from "@/lib/erp-api"
import { fetchClarityInsights, SNAPSHOT_DIMENSIONS } from "@/lib/clarity-api"

export const dynamic = "force-dynamic"

const SP_OFFSET_MS = 3 * 60 * 60 * 1000

// O cron roda logo após a meia-noite de Brasília: "últimas 24h" ≈ o dia de
// ontem em SP, e é com essa data que a linha é gravada.
function yesterdaySaoPaulo(): Date {
  const spLocal = new Date(Date.now() - SP_OFFSET_MS)
  spLocal.setUTCDate(spLocal.getUTCDate() - 1)
  return new Date(`${spLocal.toISOString().slice(0, 10)}T00:00:00.000Z`)
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const date = yesterdaySaoPaulo()

  try {
    const results = []
    for (const dims of SNAPSHOT_DIMENSIONS) {
      const payload = await fetchClarityInsights(dims)
      const dimensions = dims.join(",")
      // Vira um lp_events type=clarity_snapshot no ERP; o do mesmo dia/dimensões é substituído.
      await erpApi.upsertClaritySnapshot({ date: date.toISOString().slice(0, 10), dimensions, payload })
      results.push({
        dimensions,
        rows: payload.reduce((n, m) => n + (m.information?.length ?? 0), 0),
      })
    }
    return NextResponse.json({ date: date.toISOString().slice(0, 10), results })
  } catch (err) {
    console.error("[cron/sync-clarity] erro:", err)
    // A rota exige CRON_SECRET; o motivo vai no corpo para aparecer no log da GitHub Action
    // (sem ele, só os logs da Vercel mostravam a causa). As mensagens não carregam segredos.
    const reason = err instanceof Error ? err.message.slice(0, 300) : String(err).slice(0, 300)
    return NextResponse.json({ error: "sync_failed", reason }, { status: 500 })
  }
}
