import { erpApi } from "@/lib/erp-api";
import { EventAlreadyExistsError, findLeadEvent, getCloserEmail, isCalendarAccountError } from "@/lib/google-calendar";

// Fila de SDRs da lp-09: cada lead que agenda cai na agenda do próximo SDR da fila, que vai para
// o fim. A fila mora no Dashcom (/external/lp/sdr-queue) e o admin da Matriz monta no CRM
// (Admin > Gestão > Fila de SDRs da LP). Fila vazia ou Dashcom fora do ar: cai na agenda fixa de
// CLOSER_CALENDAR_EMAIL, como era antes, para o lead nunca ficar sem reunião.
//
// Agenda que some (11/11/2026: a conta do Yoshio, agenda fixa, foi apagada e nenhum lead
// conseguia agendar): nenhuma agenda com erro derruba o agendamento. A LP troca de SDR e, se
// nada der, cai na agenda fixa (bookOnAvailableAgenda).

const SITE = "alpha-restaurante";
// O lead está esperando na página: a fila não pode segurar o agendamento.
const ASSIGN_TIMEOUT_MS = 5000;
const LOOKUP_TIMEOUT_MS = 3000;
// SDRs da fila tentados por agendamento antes da agenda fixa.
const MAX_QUEUE_ATTEMPTS = 3;

export type AgendaSdr = {
  email: string;
  name: string | null;
  // true = veio da fila (a LP confirma a reunião de volta no Dashcom).
  fromQueue: boolean;
};

type UnavailableReason = "calendar_account_invalid" | "calendar_error";

function fallbackSdr(): AgendaSdr | null {
  const email = getCloserEmail();
  if (!email) return null;
  return {
    email,
    name: process.env.CLOSER_NAME?.trim() || null,
    fromQueue: false,
  };
}

// SDR do agendamento pela fila. Chamar só depois de checar que o lead ainda não tem reunião: sem
// atribuição anterior, a fila anda. null = fila vazia, sem SDR utilizável ou Dashcom fora.
async function queueSdr(
  lead: { leadKey: string; empresa: string },
  excluded: string[],
  reason: UnavailableReason | null
): Promise<AgendaSdr | null> {
  try {
    const { assignment } = await erpApi.assignSdr(
      {
        leadKey: lead.leadKey,
        empresa: lead.empresa,
        site: SITE,
        ...(excluded.length > 0 && { excludeSdrEmails: excluded }),
        ...(reason && { unavailableReason: reason }),
      },
      ASSIGN_TIMEOUT_MS
    );
    // Dashcom antigo ignora excludeSdrEmails e devolveria o mesmo SDR: trata como fila esgotada.
    if (assignment && !excluded.includes(assignment.sdrEmail.toLowerCase())) {
      return { email: assignment.sdrEmail, name: assignment.sdrName, fromQueue: true };
    }
    if (!assignment) console.warn("[sdr-queue] Fila sem SDR disponível", { leadKey: lead.leadKey, excluded });
  } catch (err) {
    console.error("[sdr-queue] Falha ao pedir SDR à fila:", err);
  }
  return null;
}

// Cria a reunião na agenda do SDR da fila. Se a agenda dele falhar (conta apagada/suspensa no
// Workspace ou erro do Google), pede o próximo SDR ao Dashcom, que pausa o SDR com conta inválida.
// Esgotada a fila, tenta a agenda fixa. Só lança se nenhuma agenda aceitou (ou EventAlreadyExists).
export async function bookOnAvailableAgenda<T>(
  lead: { leadKey: string; empresa: string },
  book: (sdr: AgendaSdr) => Promise<T>
): Promise<{ sdr: AgendaSdr; result: T }> {
  const excluded: string[] = [];
  let reason: UnavailableReason | null = null;
  let lastError: unknown = new Error("Nenhuma agenda disponível (fila vazia e CLOSER_CALENDAR_EMAIL ausente)");

  const attempt = async (sdr: AgendaSdr) => {
    try {
      return { ok: true as const, result: await book(sdr) };
    } catch (err) {
      if (err instanceof EventAlreadyExistsError) throw err;
      lastError = err;
      excluded.push(sdr.email.toLowerCase());
      // Uma conta inválida na rodada basta para o Dashcom pausar quem estiver na lista.
      if (isCalendarAccountError(err)) reason = "calendar_account_invalid";
      else reason ??= "calendar_error";
      console.error("[sdr-queue] Agenda recusou a reunião, trocando de agenda", {
        leadKey: lead.leadKey,
        email: sdr.email,
        fromQueue: sdr.fromQueue,
        err,
      });
      return { ok: false as const };
    }
  };

  for (let i = 0; i < MAX_QUEUE_ATTEMPTS; i++) {
    const sdr = await queueSdr(lead, excluded, reason);
    if (!sdr) break;
    const r = await attempt(sdr);
    if (r.ok) return { sdr, result: r.result };
  }

  const fallback = fallbackSdr();
  if (fallback && !excluded.includes(fallback.email.toLowerCase())) {
    if (excluded.length === 0) console.warn("[sdr-queue] Usando CLOSER_CALENDAR_EMAIL", { leadKey: lead.leadKey });
    const r = await attempt(fallback);
    if (r.ok) return { sdr: fallback, result: r.result };
  }
  throw lastError;
}

// Agendas onde a reunião do lead pode estar: a conta genérica (AGENDA_ORGANIZER_EMAIL), a do SDR
// que a fila deu ao lead e a fixa (eventos de antes da fila e os criados no fallback). A genérica
// não basta sozinha: se ela falhar, o evento nasce na agenda do SDR.
async function agendaCalendars(leadKey: string): Promise<string[]> {
  const calendars = new Set<string>();
  const organizer = process.env.AGENDA_ORGANIZER_EMAIL?.trim().toLowerCase();
  if (organizer) calendars.add(organizer);

  const assigned = await erpApi
    .findSdrAssignment(leadKey, LOOKUP_TIMEOUT_MS)
    .then((r) => r.assignment?.sdrEmail ?? null)
    .catch((err) => {
      console.error("[sdr-queue] Falha ao consultar o SDR do lead:", err);
      return null;
    });
  if (assigned) calendars.add(assigned.toLowerCase());
  const fallback = getCloserEmail()?.toLowerCase();
  if (fallback) calendars.add(fallback);
  return [...calendars];
}

// Reunião já marcada por esse lead, em qualquer agenda possível. Agenda com erro (ex.: SDR que
// saiu do Workspace) é pulada. Se nenhuma responder, segue como "sem reunião": o agendamento não
// pode travar por uma agenda que não existe mais (o id do evento por lead ainda segura duplicata
// na mesma agenda).
export async function findLeadEventInAgendas(leadKey: string) {
  const calendars = await agendaCalendars(leadKey);
  let answered = 0;
  for (const email of calendars) {
    try {
      const event = await findLeadEvent(email, leadKey);
      answered++;
      if (event) return event;
    } catch (err) {
      console.error("[sdr-queue] Falha ao consultar agenda", { email, err });
    }
  }
  if (calendars.length > 0 && answered === 0) {
    console.error("[sdr-queue] Nenhuma agenda respondeu; seguindo sem a checagem de reunião", { leadKey, calendars });
  }
  return null;
}

// Reunião criada: marca a atribuição como agendada no painel da fila. Nunca lança.
export async function confirmAgendaSdr(
  sdr: AgendaSdr,
  leadKey: string,
  input: { googleEventId: string; meetingAt: string; crmLeadId: string | null }
) {
  if (!sdr.fromQueue) return;
  await erpApi
    .confirmSdrAssignment(leadKey, input)
    .catch((err) => console.error("[sdr-queue] Falha ao confirmar a reunião na fila:", err));
}
