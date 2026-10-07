"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { partialEmailSchema, partialTelefoneSchema } from "@/lib/validation";

type PartialLeadInput = {
  sessionId?: string;
  email?: string;
  telefone?: string;
};

// Só grava em partial_leads — NÃO chama webhook: o webhook do CRM recebe apenas
// o lead completo (submit-lead.ts), senão vira lead sem nome/empresa/faturamento.
// Best-effort: nunca deve travar a UI nem aparecer como erro pro usuário.
// Chamado no onBlur de e-mail/telefone em components/lead-form.tsx, antes do
// envio final — captura contato de quem preenche e abandona o formulário,
// para uma futura automação de recuperação de leads (n8n).
export async function submitPartialLead(input: PartialLeadInput): Promise<void> {
  if (!input.sessionId) return; // sem sessão não dá pra casar com o lead completo depois

  const emailResult = input.email ? partialEmailSchema.safeParse(input.email) : null;
  const telefoneResult = input.telefone ? partialTelefoneSchema.safeParse(input.telefone) : null;

  const email = emailResult?.success ? emailResult.data : undefined;
  const telefone = telefoneResult?.success ? telefoneResult.data : undefined;

  // Nenhum dos dois campos está válido ainda (ex: usuário no meio da digitação) — ignora.
  if (!email && !telefone) return;

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    null;

  let utmFields: {
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmContent: string | null;
    utmTerm: string | null;
    referrer: string | null;
  } | null = null;

  try {
    utmFields = await db.session.findUnique({
      where: { id: input.sessionId },
      select: {
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        utmContent: true,
        utmTerm: true,
        referrer: true,
      },
    });
  } catch {
    // UTMs são melhor-esforço — segue sem elas se a sessão não existir/DB falhar
  }

  const data = {
    ...(email ? { email } : {}),
    ...(telefone ? { telefone } : {}),
    ipAddress: ip,
    ...(utmFields ?? {}),
  };

  try {
    await db.partialLead.upsert({
      where: { sessionId: input.sessionId },
      create: { sessionId: input.sessionId, ...data },
      update: data,
    });
  } catch (err) {
    console.error("[submit-partial-lead] Erro ao salvar captura parcial:", err);
    return;
  }
}
