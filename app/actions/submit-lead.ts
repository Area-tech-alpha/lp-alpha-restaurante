"use server";

import { cookies, headers } from "next/headers";
import { after } from "next/server";
import { leadSchema, LeadFormData } from "@/lib/validation";
import { db } from "@/lib/db";
import { sendLeadToMetaCapi } from "@/lib/meta-capi";
import { variantFromUrl } from "@/lib/variants";
import { agendamentoPathAposCadastro } from "@/lib/agendamento";
import { createAgendamentoToken } from "@/lib/agendamento-token";
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

// O banco é secundário (o CRM é a fonte primária): com ele fora do ar cada
// consulta esperava o timeout de conexão em sequência e o envio levava ~30s.
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
  let dbOk = true;

  if (sessionId) {
    try {
      const session = await comTeto(db.session.findUnique({
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
      }), 2000);
      if (session) {
        const { landingUrl, fbclid, startedAt, ...utms } = session;
        utmFields = utms;
        variant = variantFromUrl(landingUrl);
        sessionFbclid = fbclid;
        sessionStartedAt = startedAt;
      }
    } catch (err) {
      // UTMs são melhores-esforços — não bloquear o lead por isso
      console.error("[submit-lead] Banco indisponível ao buscar sessão:", err);
      dbOk = false;
    }
  }

  const metaIds = resolveMetaClickIds(
    await cookies(),
    sessionFbclid,
    sessionStartedAt
  );

  // Salva lead no banco
  let leadId = "unknown";
  if (dbOk) {
    try {
      const lead = await comTeto(db.lead.create({
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
        // Sem select o Prisma faz RETURNING de todas as colunas: se o deploy sair
        // antes de uma migration que adiciona colunas, o INSERT quebra em todas as LPs.
        select: { id: true },
      }), 3000);
      leadId = lead.id;
    } catch (err) {
      console.error("[submit-lead] Erro ao salvar lead no banco:", err);
      // Continua mesmo sem salvar — o webhook é a fonte primária.
      // Loga um evento (best-effort) pra esse lead não desaparecer em silêncio
      // do dashboard: ele chega ao CRM mas fica invisível no funil/KPIs.
      if (sessionId) {
        after(() =>
          db.event
            .create({ data: { sessionId, type: "lead_db_write_failed" } })
            .then(() => {}, () => {})
        );
      }
    }
  }

  // O agendamento não depende do banco: os dados do lead vão criptografados na
  // URL (lib/agendamento-token.ts), então funciona mesmo se o INSERT falhar.
  if (agendamentoPath) {
    try {
      const token = createAgendamentoToken({
        leadKey: leadId !== "unknown" ? leadId : randomUUID(),
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
      });
      redirectTo = `${agendamentoPath}?t=${token}`;
    } catch (err) {
      console.error("[submit-lead] Falha ao gerar token de agendamento:", err);
      redirectTo = qualificacao.redirectTo;
    }
  }

  // Formulário completo: marca a captura parcial da mesma sessão (se existir)
  // como convertida, pra a automação de recuperação (n8n) não tentar mais
  // reengajar quem já virou lead. Best-effort — não existe partial_lead pra
  // toda sessão (ex: autofill sem passar pelo onBlur), e tudo bem.
  if (sessionId && leadId !== "unknown") {
    after(() =>
      db.partialLead
        .update({ where: { sessionId }, data: { convertedAt: new Date() } })
        .then(() => {}, () => {})
    );
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
      after(() =>
        db.lead.update({
          where: { id: leadId },
          data: { webhookSentAt: new Date(), webhookStatus },
          select: { id: true },
        }).then(() => {}, () => {})
      );
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
