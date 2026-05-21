"use server";

import { leadSchema, LeadFormData } from "@/lib/validation";

type ActionResult = { success: true } | { success: false; error: string };

export async function submitLead(data: LeadFormData): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique o formulário." };
  }

  const webhookUrl = process.env.CRM_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("[submit-lead] CRM_WEBHOOK_URL não definida");
    return { success: false, error: "Serviço indisponível. Tente mais tarde." };
  }

  const payload = {
    nome: parsed.data.nome,
    email: parsed.data.email,
    telefone: parsed.data.telefone,
    empresa: parsed.data.empresa,
    segmento: parsed.data.segmento,
    faturamento: parsed.data.faturamento,
    cnpj: parsed.data.cnpj,
    investiria: parsed.data.investiria,
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`[submit-lead] Webhook retornou ${res.status}`);
      return { success: false, error: "Erro ao enviar. Tente novamente em instantes." };
    }

    return { success: true };
  } catch (err) {
    console.error("[submit-lead] Erro de rede:", err);
    return { success: false, error: "Erro de conexão. Verifique sua internet e tente novamente." };
  }
}
