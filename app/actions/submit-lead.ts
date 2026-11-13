"use server";

import { cookies, headers } from "next/headers";
import { after } from "next/server";
import { leadSchema, LeadFormData } from "@/lib/validation";
import { erpApi, ErpApiError } from "@/lib/erp-api";
import { sendLeadToMetaCapi } from "@/lib/meta-capi";
import { hasAgendamento, variantFromUrl } from "@/lib/variants";
import { agendamentoPathAposCadastro } from "@/lib/agendamento";
import { createAgendamentoToken, type LeadAgendamento } from "@/lib/agendamento-token";
import { buildCrmLeadPayload, sendFormLeadToCrm, sendLeadToCrm } from "@/lib/crm";
import { scheduleAgendamentoFollowup } from "@/lib/agendamento-followup";
import { isAgendamentoLeilaoEnabled } from "@/lib/agendamento-leilao";
import { checkLeadRateLimit } from "@/lib/rate-limit";
import { content } from "@/lib/content";
import { randomUUID } from "node:crypto";

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

// O ERP (lp_* via Dashcom) é secundário (o CRM é a fonte primária): com ele fora do ar
// cada chamada esperava o timeout em sequência e o envio levava ~30s.
// Cada consulta no caminho do usuário tem um teto; se uma estoura, as demais
// são puladas e o resto do registro vai para o after().
function comTeto<T>(query: PromiseLike<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    Promise.resolve(query),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`db_timeout_${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

// webhookStatus 0 = não chegou a ter resposta do CRM (rede ou env faltando).
// Sem SDR: o SDR sai da fila só quando o lead agenda (lib/sdr-queue.ts), e é ele que vira o dono.
// Quem não agenda fica na Matriz sem dono (decisão de 06/11/2026).
async function enviarAoCrm(lead: LeadAgendamento) {
  const result = await sendLeadToCrm(buildCrmLeadPayload(lead, null));
  return result.status === "sent"
    ? { ok: result.ok, status: result.httpStatus, crmLeadId: result.crmLeadId ?? null }
    : { ok: false, status: 0, crmLeadId: null };
}

// Formulário sem agendamento: o Dashcom classifica e distribui (Matriz, leilão ou oportunidade).
async function enviarFormularioAoCrm(payload: Record<string, unknown>) {
  const result = await sendFormLeadToCrm(payload);
  return result.status === "sent"
    ? { ok: result.ok, status: result.httpStatus, crmLeadId: result.crmLeadId ?? null }
    : { ok: false, status: 0, crmLeadId: null };
}

type ActionResult =
  | { success: true; redirectTo: string; qualified: boolean }
  | { success: false; error: string; reason: "validation" | "server" | "rate_limited" };

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

  // investiria só é perguntado para faturamento "Até 30 mil".
  const qualificacao = qualificarLead(parsed.data.faturamento, parsed.data.investiria);
  const { qualified } = qualificacao;
  const agendamentoPath = agendamentoPathAposCadastro({ variant: formVariant, qualified });
  let redirectTo = agendamentoPath ?? qualificacao.redirectTo;

  // Variação com agendamento: o qualificado vai direto para o CRM da Matriz (lib/crm.ts).
  // O resto vai para o intake de LP do Dashcom, que decide entre Matriz, leilão e oportunidade.
  if (!process.env.CRM_API_URL || !process.env.CRM_EXTERNAL_LEADS_API_KEY) {
    console.error("[submit-lead] CRM_API_URL / CRM_EXTERNAL_LEADS_API_KEY não definidas");
    return { success: false, error: "Serviço indisponível. Tente mais tarde.", reason: "server" };
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    null;

  // Antes de gravar/enviar qualquer coisa: barra reenvio do mesmo lead (e-mail,
  // telefone) e abuso por IP. Só nas variações com agendamento (lp-09).
  if (formVariant && hasAgendamento(formVariant)) {
    const limit = await checkLeadRateLimit({ email: parsed.data.email, telefone: parsed.data.telefone, ip });
    if (!limit.ok) {
      console.warn("[submit-lead] Rate limit", { by: limit.by, variant: formVariant });
      return {
        success: false,
        reason: "rate_limited",
        error: content.form.rateLimited.replace("{min}", String(limit.retryAfterMinutes)),
      };
    }
  }

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
  let dbOk = true;

  if (sessionId) {
    try {
      const session = await comTeto(erpApi.getSession(sessionId, 2000), 2000);
      const { landingUrl, fbclid, startedAt, utmSource, utmMedium, utmCampaign, utmContent, utmTerm, referrer } =
        session;
      utmFields = { utmSource, utmMedium, utmCampaign, utmContent, utmTerm, referrer };
      variant = variantFromUrl(landingUrl);
      sessionFbclid = fbclid;
      sessionStartedAt = new Date(startedAt);
    } catch (err) {
      // Sessão inexistente (404) não é falha do ERP: o lead é gravado sem UTMs da sessão.
      if (!(err instanceof ErpApiError && err.status === 404)) {
        // UTMs são melhores-esforços — não bloquear o lead por isso
        console.error("[submit-lead] ERP indisponível ao buscar sessão:", err);
        dbOk = false;
      }
    }
  }

  const metaIds = resolveMetaClickIds(
    await cookies(),
    sessionFbclid,
    sessionStartedAt
  );

  // Salva o lead em lp_leads. O id nasce aqui: o POST é idempotente e o mesmo id vai pro
  // webhook, pro token do agendamento e pro log da CAPI mesmo se a gravação falhar.
  const leadId = randomUUID();
  // Fluxo do leilão: só o lead qualificado de variação com agendamento, com a env ligada.
  const leilao = !!agendamentoPath && isAgendamentoLeilaoEnabled();
  let leadSaved = false;
  if (dbOk) {
    try {
      await comTeto(erpApi.submitLead({
          id: leadId,
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
          ...(leilao && { awaitScheduling: true }),
      }, 3000), 3000);
      leadSaved = true;
    } catch (err) {
      console.error("[submit-lead] Erro ao salvar lead no ERP:", err);
      // Continua mesmo sem salvar — o webhook é a fonte primária.
      // Loga um evento (best-effort) pra esse lead não desaparecer em silêncio
      // do dashboard: ele chega ao CRM mas fica invisível no funil/KPIs.
      if (sessionId) {
        after(() => erpApi.trackEvent(sessionId, "lead_db_write_failed").then(() => {}, () => {}));
      }
    }
  }

  // O agendamento não depende do banco: os dados do lead vão criptografados na
  // URL (lib/agendamento-token.ts), então funciona mesmo se o INSERT falhar.
  const leadAgendamento: LeadAgendamento | null = agendamentoPath
    ? {
        leadKey: leadId,
        crmLeadId: null,
        nome: parsed.data.nome,
        email: parsed.data.email,
        telefone: parsed.data.telefone,
        empresa: parsed.data.empresa,
        segmento: parsed.data.segmento,
        faturamento: parsed.data.faturamento,
        cnpj: parsed.data.cnpj ?? null,
        investiria: parsed.data.investiria ?? null,
        variante: formVariant ?? variant ?? "",
        utm_source: utmFields.utmSource ?? null,
        utm_medium: utmFields.utmMedium ?? null,
        utm_campaign: utmFields.utmCampaign ?? null,
        utm_content: utmFields.utmContent ?? null,
        utm_term: utmFields.utmTerm ?? null,
        referrer: utmFields.referrer ?? null,
        ...metaIds,
        sessionId: sessionId ?? null,
        ...(leilao && { flow: "auction" as const }),
      }
    : null;

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
  const logMetaLead = async () => {
    const result =
      !qualified
        ? { status: "not_qualified" }
        : !eventId
          ? { status: "no_event_id" }
          : await sendLeadToMetaCapi(capiInput);
    if (!sessionId) return;
    await erpApi
      .trackEvent(sessionId, "meta_capi_lead", { ...result, eventId: eventId ?? null, leadId, qualified })
      .catch((err) => console.error("[submit-lead] Falha ao gravar log da CAPI:", err));
  };

  // A captura parcial da mesma sessão (se existir) vira este lead no próprio Dashcom
  // (submitted_at preenchido), então não há "convertida" pra marcar aqui.

  const payload = {
    lead_id: leadSaved ? leadId : "unknown",
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

  // Fluxo do leilão (lib/agendamento-leilao.ts): o lead qualificado da variação com agendamento
  // não vai ao CRM agora. Ele ficou gravado em lp_leads como "aguardando a reunião": se agendar,
  // vai com a reunião para o leilão do Growth Hub; se não agendar em 5 min, o Dashcom manda pelo
  // caminho normal das outras LPs. Sem a gravação em lp_leads ninguém faria esse envio, então o
  // lead vai ao CRM agora mesmo.
  if (leilao && leadAgendamento && agendamentoPath) {
    if (!leadSaved) {
      const res = await enviarFormularioAoCrm(payload);
      console.error("[submit-lead] lp_leads fora do ar; lead enviado direto ao CRM", { leadId, res });
      if (!res.ok) {
        return { success: false, error: "Erro ao enviar. Tente novamente em instantes.", reason: "server" };
      }
    }
    try {
      redirectTo = `${agendamentoPath}?t=${createAgendamentoToken(leadAgendamento)}`;
    } catch (err) {
      // Sem token não há agendamento: o lead segue pelo Dashcom como quem não agendou.
      console.error("[submit-lead] Falha ao gerar token de agendamento (leilão):", err);
      redirectTo = qualificacao.redirectTo;
    }
    after(() => logMetaLead());
    return { success: true, redirectTo, qualified };
  }

  try {
    const res = leadAgendamento
      ? await enviarAoCrm(leadAgendamento)
      : await enviarFormularioAoCrm(payload);

    const webhookStatus = res.status;

    if (leadSaved) {
      const crmLeadId = "crmLeadId" in res ? res.crmLeadId : null;
      after(() =>
        erpApi
          .updateLead(leadId, { webhookSentAt: new Date().toISOString(), webhookStatus, crmLeadId })
          .then(() => {}, (err) => console.error("[submit-lead] Falha ao gravar retorno do webhook:", err))
      );
    }

    if (!res.ok) {
      console.error(`[submit-lead] Webhook retornou ${res.status}`);
      return { success: false, error: "Erro ao enviar. Tente novamente em instantes.", reason: "server" };
    }

    // Token só depois do CRM: leva o crmLeadId até o webhook do agendamento.
    if (agendamentoPath && leadAgendamento) {
      try {
        const crmLeadId = "crmLeadId" in res ? res.crmLeadId : null;
        const token = createAgendamentoToken({ ...leadAgendamento, crmLeadId });
        redirectTo = `${agendamentoPath}?t=${token}`;
        after(() => scheduleAgendamentoFollowup(token));
      } catch (err) {
        console.error("[submit-lead] Falha ao gerar token de agendamento:", err);
        redirectTo = qualificacao.redirectTo;
      }
    }

    after(() => logMetaLead());

    return { success: true, redirectTo, qualified };
  } catch (err) {
    console.error("[submit-lead] Erro de rede ao chamar o webhook:", err);
    return { success: false, error: "Erro de conexão. Verifique sua internet e tente novamente.", reason: "server" };
  }
}
