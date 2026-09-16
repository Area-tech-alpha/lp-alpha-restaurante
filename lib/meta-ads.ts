const GRAPH_API_VERSION = "v21.0"

type MetaInsightRow = {
  campaign_id: string
  campaign_name: string
  date_start: string
  inline_link_clicks?: string
}

type MetaInsightsResponse = {
  data: MetaInsightRow[]
  paging?: { next?: string }
}

export type CampaignClicks = {
  date: string
  campaignId: string
  campaignName: string
  clicks: number
}

// Insights da conta de anúncios, por campanha e por dia. "inline_link_clicks"
// é o clique no link do anúncio (o que efetivamente leva à LP) — não usar
// "clicks" puro, que inclui interações que não saem do Meta (ex: expandir carrossel).
//
// Casamento com as sessões é por campaign_id, não campaign_name: o UTM em uso
// nos anúncios da Alpha é utm_campaign={{campaign.id}} (confirmado batendo os
// valores reais gravados em sessions.utmCampaign contra a API) — nomes de
// campanha mudam e não são estáveis o suficiente pra chave de junção.
export async function fetchMetaAdClicks(since: string, until: string): Promise<CampaignClicks[]> {
  const token = process.env.META_ACCESS_TOKEN
  const accountId = process.env.META_AD_ACCOUNT_ID
  if (!token || !accountId) {
    throw new Error("META_ACCESS_TOKEN ou META_AD_ACCOUNT_ID não definidos")
  }

  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${accountId}/insights`)
  url.searchParams.set("level", "campaign")
  url.searchParams.set("time_increment", "1")
  url.searchParams.set("fields", "campaign_id,campaign_name,inline_link_clicks,date_start")
  url.searchParams.set("time_range", JSON.stringify({ since, until }))
  url.searchParams.set("limit", "500")
  url.searchParams.set("access_token", token)

  // A conta de anúncios roda campanhas de outros produtos/LPs da Alpha também.
  // Restringe direto na API às campanhas confirmadas pelo marketing pra essa
  // LP — não depende só do filtro no dashboard, evita puxar volume irrelevante.
  const campaignIds = process.env.META_CAMPAIGN_IDS?.split(",").map((id) => id.trim()).filter(Boolean)
  if (campaignIds && campaignIds.length > 0) {
    url.searchParams.set(
      "filtering",
      JSON.stringify([{ field: "campaign.id", operator: "IN", value: campaignIds }])
    )
  }

  const rows: CampaignClicks[] = []
  let nextUrl: string | null = url.toString()

  while (nextUrl) {
    const res = await fetch(nextUrl)
    if (!res.ok) {
      // Não logar nextUrl aqui: contém o access_token na query string.
      const body = await res.text().catch(() => "")
      throw new Error(`Meta Insights API retornou ${res.status}: ${body}`)
    }

    const json = (await res.json()) as MetaInsightsResponse
    for (const row of json.data) {
      rows.push({
        date: row.date_start,
        campaignId: row.campaign_id,
        campaignName: row.campaign_name,
        clicks: Number(row.inline_link_clicks ?? 0),
      })
    }

    nextUrl = json.paging?.next ?? null
  }

  return rows
}
