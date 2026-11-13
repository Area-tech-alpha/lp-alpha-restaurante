// A LP não tem banco: sessões, eventos e leads ficam nas tabelas lp_* do ERP, gravadas pelo
// Dashcom (Dashboard-Comercial-Back-V2, o mesmo serviço do CRM_API_URL) em /external/lp/*.
// Tudo aqui é best-effort para quem chama: o lead vai pro CRM/webhook mesmo se o ERP falhar.
// ADR: erp_core/docs/database/adr-lp-restaurante-banco-erp-2026-11-05.md.

const DEFAULT_TIMEOUT_MS = 4000;

export class ErpApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

async function call<T>(
  method: "GET" | "POST" | "PATCH" | "PUT",
  path: string,
  body?: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const baseUrl = process.env.CRM_API_URL;
  const apiKey = process.env.LP_TRACKING_API_KEY;
  if (!baseUrl || !apiKey) throw new ErpApiError("CRM_API_URL / LP_TRACKING_API_KEY não definidas", 0);

  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/external/lp${path}`, {
    method,
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = (await res.text().catch(() => "")).slice(0, 300);
    throw new ErpApiError(`${method} /external/lp${path} → ${res.status} ${text}`, res.status);
  }
  return (await res.json()) as T;
}

export type LpSessionInput = {
  id?: string;
  landingUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  deviceType?: string;
  fbclid?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type LpSession = {
  id: string;
  landingUrl: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  fbclid: string | null;
  startedAt: string;
};

export type LpEventInput = { type: string; data?: Record<string, unknown> | null; ts?: string };

export type LpLeadInput = {
  id: string;
  sessionId?: string | null;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  segmento: string;
  faturamento: string;
  cnpj?: string | null;
  investiria?: string | null;
  qualified: boolean;
  redirectUrl?: string | null;
  ipAddress?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  referrer?: string | null;
  fbclid?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  // Fluxo do leilão (lib/agendamento-leilao.ts): o lead espera a reunião antes de ir ao CRM. Se
  // não agendar em 5 min, o próprio Dashcom manda pelo intake normal.
  awaitScheduling?: boolean;
};

// Fila de SDRs da lp-09 (Dashcom, /external/lp/sdr-queue). O admin da Matriz monta a fila no CRM.
export type LpSdrAssignment = {
  assignmentId: string;
  leadKey: string;
  sdrUserId: string;
  sdrName: string;
  sdrEmail: string;
  status: string;
  // false = a fila andou agora; true = o lead já tinha esse SDR (retry, link reaberto).
  reused: boolean;
};

// Remove null/undefined: o Dashcom valida com whitelist e IsOptional não aceita null em string.
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null)) as Partial<T>;
}

export const erpApi = {
  upsertSession: (input: LpSessionInput) =>
    call<{ sessionId: string }>("POST", "/sessions", compact(input)),

  getSession: (id: string, timeoutMs?: number) =>
    call<LpSession>("GET", `/sessions/${encodeURIComponent(id)}`, undefined, timeoutMs),

  trackEvents: (input: {
    sessionId: string;
    events: LpEventInput[];
    maxScrollDepth?: number;
    timeOnPageSec?: number;
  }) =>
    call<{ count: number }>("POST", "/events", {
      ...compact({
        sessionId: input.sessionId,
        maxScrollDepth: input.maxScrollDepth,
        timeOnPageSec: input.timeOnPageSec,
      }),
      events: input.events.map((e) => compact(e)),
    }),

  trackEvent: (sessionId: string, type: string, data?: Record<string, unknown>) =>
    call<{ count: number }>("POST", "/events", {
      sessionId,
      events: [compact({ type, data })],
    }),

  upsertPartialLead: (input: { sessionId: string; email?: string; telefone?: string; ipAddress?: string | null }) =>
    call<{ id: string; created: boolean }>("POST", "/leads/partial", compact(input)),

  submitLead: (input: LpLeadInput, timeoutMs?: number) =>
    call<{ id: string; created: boolean }>("POST", "/leads", compact(input), timeoutMs),

  updateLead: (
    id: string,
    input: { webhookSentAt?: string; webhookStatus?: number; crmLeadId?: string | null }
  ) => call<{ id: string }>("PATCH", `/leads/${encodeURIComponent(id)}`, compact(input)),

  // Gira a fila (ou devolve o SDR que o lead já tem). null = fila vazia ou sem SDR ativo.
  // excludeSdrEmails: SDRs cuja agenda o Google recusou agora (o lead troca de SDR).
  // unavailableReason "calendar_account_invalid": conta apagada/suspensa, o Dashcom pausa o SDR.
  assignSdr: (
    input: {
      leadKey: string;
      empresa?: string | null;
      site?: string;
      excludeSdrEmails?: string[];
      unavailableReason?: "calendar_account_invalid" | "calendar_error";
    },
    timeoutMs?: number
  ) => call<{ assignment: LpSdrAssignment | null }>("POST", "/sdr-queue/assign", compact(input), timeoutMs),

  findSdrAssignment: (leadKey: string, timeoutMs?: number) =>
    call<{ assignment: LpSdrAssignment | null }>(
      "GET",
      `/sdr-queue/assignments/${encodeURIComponent(leadKey)}`,
      undefined,
      timeoutMs
    ),

  confirmSdrAssignment: (
    leadKey: string,
    input: { googleEventId?: string; meetingAt?: string; crmLeadId?: string | null }
  ) =>
    call<{ id: string; status: string }>(
      "PATCH",
      `/sdr-queue/assignments/${encodeURIComponent(leadKey)}`,
      compact(input)
    ),

  upsertClaritySnapshot: (input: { date: string; dimensions: string; payload: unknown[] }) =>
    call<{ date: string; dimensions: string }>("PUT", "/clarity-snapshots", input, 15000),
};
