import type { LeadAgendamento } from "@/lib/agendamento-token";

// Lead qualificado de variação com agendamento (lp-09) vai direto para o CRM da
// Matriz, com o closer da agenda, e nunca para o Growth Hub (sem leilão). O
// desqualificado continua no fluxo de sempre (CRM_WEBHOOK_URL -> n8n -> Growth Hub).
// Endpoint: POST {CRM_API_URL}/external/leads (Dashboard-Comercial-Back-V2).

export type CrmMeeting = {
  scheduled_at: string;
  meeting_link: string | null;
  google_event_id: string;
};

// Mesma regra v3 do n8n: "Até 30 mil" só chega aqui respondendo "Sim" para
// investiria, e isso é D. As outras faixas o CRM classifica pelo faturamento.
function leadCategory(lead: LeadAgendamento) {
  return lead.faturamento === "Até 30 mil" && lead.investiria === "Sim" ? "D" : undefined;
}

// Sem lead_id/external_id de propósito: no intake do CRM esses campos viram o id
// do Growth Hub. O lead do envio do form e o da reunião se juntam pelo contato.
export function buildCrmLeadPayload(lead: LeadAgendamento, closerEmail: string, meeting?: CrmMeeting) {
  return {
    destination: "hq",
    closer_email: closerEmail,
    ...(meeting && { meeting }),
    source: "alpha-restaurante",
    niche: "food",
    lead_category: leadCategory(lead),
    name: lead.nome,
    company: lead.empresa,
    email: lead.email,
    phone: lead.telefone,
    document: lead.cnpj,
    faturamento: lead.faturamento,
    segmento: lead.segmento,
    utm_source: lead.utm_source,
    utm_medium: lead.utm_medium,
    utm_campaign: lead.utm_campaign,
    utm_content: lead.utm_content,
    utm_term: lead.utm_term,
    fbclid: lead.fbclid,
    fbc: lead.fbc,
    fbp: lead.fbp,
  };
}

export type CrmResult =
  | { status: "sent"; httpStatus: number; ok: boolean; crmLeadId?: string; error?: string }
  | { status: "error"; error: string };

export async function sendLeadToCrm(payload: ReturnType<typeof buildCrmLeadPayload>): Promise<CrmResult> {
  const baseUrl = process.env.CRM_API_URL;
  const apiKey = process.env.CRM_EXTERNAL_LEADS_API_KEY;
  if (!baseUrl || !apiKey) {
    console.error("[crm] CRM_API_URL / CRM_EXTERNAL_LEADS_API_KEY não definidas");
    return { status: "error", error: "crm_not_configured" };
  }
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/external/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const error = (await res.text().catch(() => "")).slice(0, 500);
      console.error(`[crm] Intake retornou ${res.status}: ${error}`);
      return { status: "sent", httpStatus: res.status, ok: false, error };
    }
    const body = (await res.json().catch(() => null)) as { crmLeadId?: string } | null;
    return { status: "sent", httpStatus: res.status, ok: true, crmLeadId: body?.crmLeadId };
  } catch (err) {
    console.error("[crm] Erro de rede:", err);
    return { status: "error", error: String(err).slice(0, 500) };
  }
}
