export type ClarityMetric = {
  metricName: string
  information: Record<string, unknown>[]
}

// Cotas da API: 10 chamadas/dia por projeto e só as últimas 24-72h. O sync
// diário usa 2 chamadas (ver SNAPSHOT_DIMENSIONS), sobrando margem para testes.
// "Device" sozinho vem completo; "URL,Device" pode bater o teto de 1.000
// linhas se o Clarity mantiver query string (fbclid/UTM) na URL.
export const SNAPSHOT_DIMENSIONS = [["Device"], ["URL", "Device"]] as const

export async function fetchClarityInsights(dimensions: readonly string[]): Promise<ClarityMetric[]> {
  const token = process.env.CLARITY_API_TOKEN
  if (!token) throw new Error("CLARITY_API_TOKEN não definido")

  const url = new URL("https://www.clarity.ms/export-data/api/v1/project-live-insights")
  url.searchParams.set("numOfDays", "1")
  dimensions.forEach((d, i) => url.searchParams.set(`dimension${i + 1}`, d))

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Clarity API ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  return (await res.json()) as ClarityMetric[]
}
