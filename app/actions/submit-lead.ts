"use server";

import { cookies, headers } from "next/headers";
import { after } from "next/server";
import { leadSchema, LeadFormData } from "@/lib/validation";
import { db } from "@/lib/db";
import { sendLeadToMetaCapi } from "@/lib/meta-capi";
import { variantFromUrl } from "@/lib/variants";
import { agendamentoPathAposCadastro } from "@/lib/agendamento";

// Qualificado = faturamento acima de 30 mil, ou "Até 30 mil" respondendo "Sim" para
// investiria. Fonte única da verdade: decide o redirect E se o evento "Lead" vai
// para o Meta (pixel e CAPI) — o cliente não recalcula, usa o que vem daqui.
function qualificarLead(faturamento: string, investiria: string | undefined) {
  const qualified = faturamento !== "Até 30 mil" || investiria === "Sim";
  return { redirectTo: qualified ? "/obrigado" : "/agradecimento", qualified };
}

// fbclid da URL (salvo na sessão) é a fonte principal: não depende do Pixel ter
// carregado. O cookie _fbc ("fb.1.<ms>.<fbclid>") é o fallback. Sem cookie mas
// com fbclid, montamos o fbc no formato do Meta usando o início da sessão como
// timestamp do clique — assim CAPI e conversões offline continuam atribuindo.
function resolveMetaClickIds(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  sessionFbclid: string | null,
  sessionStartedAt: Date | null
) {
  const fbcCookie = cookieStore.get("_fbc")?.value ?? null;
  const fbp = cookieStore.get("_fbp")?.value ?? null;
  const fbclidFromCookie = fbcCookie?.split(".").slice(3).join(".") || null;
  const fbclid = sessionFbclid ?? fbclidFromCookie;

  const fbc =
    fbcCookie && (!sessionFbclid || fbclidFromCookie === sessionFbclid)
      ? fbcCookie
      : fbclid
        ? `fb.1.${(sessionStartedAt ?? new Date()).getTime()}.${fbclid}`
        : null;

  return { fbclid, fbc, fbp };
}

type ActionResult =
  | { success: true; redirectTo: string; qualified: boolean }
  | { success: false; error: string; reason: "validation" | "server" };

// formVariant: slug da página onde o form foi renderizado. Só decide o destino
// pós-cadastro (agendamento); a "variante" enviada ao CRM continua vindo da sessão.
export async function submitLead(
  data: LeadFormData,
  sessionId?: string,
  eventId?: string,
  formVariant?: string
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
  const qualificacao = qualificarLead(parsed.data.faturamento, parsed.data.investiria);
  const { qualified } = qualificacao;
  const agendamentoPath = agendamentoPathAposCadastro({ variant: formVariant, qualified });
  let redirectTo = agendamentoPath ?? qualificacao.redirectTo;

  // Busca UTMs da sessão para desnormalizar no lead
  let utmFields: {
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmContent?: string | null;
    utmTerm?: string | null;
    referrer?: string | null;
  } = {};
  let variant: string | null = null;
  let sessionFbclid: string | null = null;
  let sessionStartedAt: Date | null = null;

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
          landingUrl: true,
          fbclid: true,
          startedAt: true,
        },
      });
      if (session) {
        const { landingUrl, fbclid, startedAt, ...utms } = session;
        utmFields = utms;
        variant = variantFromUrl(landingUrl);
        sessionFbclid = fbclid;
        sessionStartedAt = startedAt;
      }
    } catch {
      // UTMs são melhores-esforços — não bloquear o lead por isso
    }
  }

  const metaIds = resolveMetaClickIds(
    await cookies(),
    sessionFbclid,
    sessionStartedAt
  );

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
        ...metaIds,
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

  if (agendamentoPath) {
    // Sem lead no banco não há como agendar: cai no destino padrão.
    redirectTo =
      leadId === "unknown"
        ? qualificacao.redirectTo
        : `${agendamentoPath}?lead=${encodeURIComponent(leadId)}`;
  }

  // Formulário completo: marca a captura parcial da mesma sessão (se existir)
  // como convertida, pra a automação de recuperação (n8n) não tentar mais
  // reengajar quem já virou lead. Best-effort — não existe partial_lead pra
  // toda sessão (ex: autofill sem passar pelo onBlur), e tudo bem.
  if (sessionId && leadId !== "unknown") {
    await db.partialLead
      .update({ where: { sessionId }, data: { convertedAt: new Date() } })
      .catch(() => {});
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
    variante: variant,
    utm_source: utmFields.utmSource ?? null,
    utm_medium: utmFields.utmMedium ?? null,
    utm_campaign: utmFields.utmCampaign ?? null,
    utm_content: utmFields.utmContent ?? null,
    utm_term: utmFields.utmTerm ?? null,
    referrer: utmFields.referrer ?? null,
    fbclid: metaIds.fbclid,
    fbc: metaIds.fbc,
    fbp: metaIds.fbp,
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

    const capiInput = {
      eventId: eventId ?? "",
      eventSourceUrl: headersList.get("referer") ?? undefined,
      email: parsed.data.email,
      phone: parsed.data.telefone,
      name: parsed.data.nome,
      ip,
      userAgent: headersList.get("user-agent"),
      fbp: metaIds.fbp ?? undefined,
      fbc: metaIds.fbc ?? undefined,
      externalId: sessionId,
      variant,
    };
    // Todo lead aceito gera uma linha "meta_capi_lead" (inclusive os pulados), para o
    // dashboard conseguir conciliar leads do banco com o que chegou no Meta.
    after(async () => {
      const result =
        !qualified
          ? { status: "not_qualified" }
          : !eventId
            ? { status: "no_event_id" }
            : await sendLeadToMetaCapi(capiInput);
      if (!sessionId) return;
      await db.event
        .create({
          data: {
            sessionId,
            type: "meta_capi_lead",
            data: { ...result, eventId: eventId ?? null, leadId, qualified },
          },
        })
        .catch((err) => console.error("[submit-lead] Falha ao gravar log da CAPI:", err));
    });

    return { success: true, redirectTo, qualified };
  } catch (err) {
    console.error("[submit-lead] Erro de rede ao chamar o webhook:", err);
    return { success: false, error: "Erro de conexão. Verifique sua internet e tente novamente.", reason: "server" };
  }
}
