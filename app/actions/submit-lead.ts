"use server";

import { headers } from "next/headers";
import { leadSchema, LeadFormData } from "@/lib/validation";
import { db } from "@/lib/db";

// Único critério de desqualificação: faturamento mínimo ("Até 30 mil") E não
// disposto a investir em CNPJ novo. Todo o resto vai para a página de obrigado
// qualificada — sem mais páginas segmentadas por faixa de faturamento.
function qualificarLead(faturamento: string, investiria: string | undefined) {
  if (faturamento === "Até 30 mil" && investiria === "Não") {
    return { redirectTo: "/agradecimento", qualified: false };
  }
  return { redirectTo: "/obrigado", qualified: true };
}

type ActionResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string; reason: "validation" | "server" };

export async function submitLead(
  data: LeadFormData,
  sessionId?: string
): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique o formulário.", reason: "validation" };
  }

  const webhookUrl = process.env.CRM_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("[submit-lead] CRM_WEBHOOK_URL não definida");
    return { success: false, error: "Serviço indisponível. Tente mais tarde.", reason: "server" };
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    null;

  // investiria só é perguntado para faturamento "Até 30 mil".
  const { redirectTo, qualified } = qualificarLead(parsed.data.faturamento, parsed.data.investiria);

  // Busca UTMs da sessão para desnormalizar no lead
  let utmFields: {
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmContent?: string | null;
    utmTerm?: string | null;
    referrer?: string | null;
  } = {};

  if (sessionId) {
    try {
      const session = await db.session.findUnique({
        where: { id: sessionId },
        select: {
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          utmContent: true,
          utmTerm: true,
          referrer: true,
        },
      });
      if (session) utmFields = session;
    } catch {
      // UTMs são melhores-esforços — não bloquear o lead por isso
    }
  }

  // Salva lead no banco
  let leadId: string;
  try {
    const lead = await db.lead.create({
      data: {
        nome: parsed.data.nome,
        email: parsed.data.email,
        telefone: parsed.data.telefone,
        empresa: parsed.data.empresa,
        segmento: parsed.data.segmento,
        faturamento: parsed.data.faturamento,
        cnpj: parsed.data.cnpj ?? null,
        investiria: parsed.data.investiria ?? null,
        qualified,
        redirectUrl: redirectTo,
        ipAddress: ip,
        sessionId: sessionId ?? null,
        ...utmFields,
      },
    });
    leadId = lead.id;
  } catch (err) {
    console.error("[submit-lead] Erro ao salvar lead no banco:", err);
    // Continua mesmo sem salvar — o webhook é a fonte primária.
    // Loga um evento (best-effort) pra esse lead não desaparecer em silêncio
    // do dashboard: ele chega ao CRM mas fica invisível no funil/KPIs.
    if (sessionId) {
      await db.event
        .create({ data: { sessionId, type: "lead_db_write_failed" } })
        .catch(() => {});
    }
    leadId = "unknown";
  }

  // Envia ao webhook n8n (inclui lead_id para a automação atualizar whatsapp_sent_at)
  const payload = {
    lead_id: leadId,
    nome: parsed.data.nome,
    email: parsed.data.email,
    telefone: parsed.data.telefone,
    empresa: parsed.data.empresa,
    segmento: parsed.data.segmento,
    faturamento: parsed.data.faturamento,
    cnpj: parsed.data.cnpj,
    investiria: parsed.data.investiria,
    origem: 'alpha-restaurante',
    utm_source: utmFields.utmSource ?? null,
    utm_medium: utmFields.utmMedium ?? null,
    utm_campaign: utmFields.utmCampaign ?? null,
    utm_content: utmFields.utmContent ?? null,
    utm_term: utmFields.utmTerm ?? null,
    referrer: utmFields.referrer ?? null,
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const webhookStatus = res.status;

    if (leadId !== "unknown") {
      await db.lead.update({
        where: { id: leadId },
        data: { webhookSentAt: new Date(), webhookStatus },
      }).catch(() => { });
    }

    if (!res.ok) {
      console.error(`[submit-lead] Webhook retornou ${res.status}`);
      return { success: false, error: "Erro ao enviar. Tente novamente em instantes.", reason: "server" };
    }

    return { success: true, redirectTo };
  } catch (err) {
    console.error("[submit-lead] Erro de rede ao chamar o webhook:", err);
    return { success: false, error: "Erro de conexão. Verifique sua internet e tente novamente.", reason: "server" };
  }
}
