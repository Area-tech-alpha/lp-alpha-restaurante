"use server";

import { headers } from "next/headers";
import { erpApi } from "@/lib/erp-api";
import { partialEmailSchema, partialTelefoneSchema } from "@/lib/validation";

type PartialLeadInput = {
  sessionId?: string;
  email?: string;
  telefone?: string;
};

// Só grava a captura parcial em lp_leads (pelo Dashcom) — NÃO chama webhook: o webhook do CRM
// recebe apenas o lead completo (submit-lead.ts), senão vira lead sem nome/empresa/faturamento.
// Best-effort: nunca deve travar a UI nem aparecer como erro pro usuário.
// Chamado no onBlur de e-mail/telefone em components/lead-form.tsx, antes do envio final.
// UTMs: o Dashcom copia da sessão.
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

  try {
    await erpApi.upsertPartialLead({
      sessionId: input.sessionId,
      email,
      telefone,
      ipAddress: ip?.slice(0, 64) ?? null,
    });
  } catch (err) {
    console.error("[submit-partial-lead] Erro ao salvar captura parcial:", err);
  }
}
