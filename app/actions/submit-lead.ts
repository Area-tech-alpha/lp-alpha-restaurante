"use server";

import { headers } from "next/headers";
import { leadSchema, LeadFormData } from "@/lib/validation";
import { db } from "@/lib/db";

const REDIRECT_QUALIFIED = "/obrigado";
const REDIRECT_UNQUALIFIED = "/agradecimento";

type ActionResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

export async function submitLead(
  data: LeadFormData,
  sessionId?: string
): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique o formulário." };
  }

  const webhookUrl = process.env.CRM_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("[submit-lead] CRM_WEBHOOK_URL não definida");
    return { success: false, error: "Serviço indisponível. Tente mais tarde." };
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    null;

  // investiria só é perguntado para faturamento "Até 30 mil".
  // Para faixas maiores chega undefined → tratado como qualificado (consistente com o redirect).
  const qualified = parsed.data.investiria !== "Não";
  const redirectTo = parsed.data.investiria === "Não" ? REDIRECT_UNQUALIFIED : REDIRECT_QUALIFIED;

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
    // Continua mesmo sem salvar — o webhook é a fonte primária
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
    origem: 'alpha-restaurante'
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
      return { success: false, error: "Erro ao enviar. Tente novamente em instantes." };
    }

    return { success: true, redirectTo };
  } catch (err) {
    console.error("[submit-lead] Erro de rede:", err);
    return { success: false, error: "Erro de conexão. Verifique sua internet e tente novamente." };
  }
}
