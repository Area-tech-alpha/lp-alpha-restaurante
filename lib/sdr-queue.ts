import { erpApi } from "@/lib/erp-api";
import { findLeadEvent, getCloserEmail } from "@/lib/google-calendar";

// Fila de SDRs da lp-09: cada lead que agenda cai na agenda do próximo SDR da fila, que vai para
// o fim. A fila mora no Dashcom (/external/lp/sdr-queue) e o admin da Matriz monta no CRM
// (Admin > Gestão > Fila de SDRs da LP). Fila vazia ou Dashcom fora do ar: cai na agenda fixa de
// CLOSER_CALENDAR_EMAIL, como era antes, para o lead nunca ficar sem reunião.

const SITE = "alpha-restaurante";
// O lead está esperando na página: a fila não pode segurar o agendamento.
const ASSIGN_TIMEOUT_MS = 5000;
const LOOKUP_TIMEOUT_MS = 3000;

export type AgendaSdr = {
  email: string;
  name: string | null;
  // true = veio da fila (a LP confirma a reunião de volta no Dashcom).
  fromQueue: boolean;
};

function fallbackSdr(): AgendaSdr {
  return {
    email: getCloserEmail(),
    name: process.env.CLOSER_NAME?.trim() || null,
    fromQueue: false,
  };
}

// SDR do agendamento. Chamar só depois de checar que o lead ainda não tem reunião: sem
// atribuição anterior, a fila anda.
export async function resolveAgendaSdr(lead: { leadKey: string; empresa: string }): Promise<AgendaSdr> {
  try {
    const { assignment } = await erpApi.assignSdr(
      { leadKey: lead.leadKey, empresa: lead.empresa, site: SITE },
      ASSIGN_TIMEOUT_MS
    );
    if (assignment) {
      return {
        email: assignment.sdrEmail,
        name: assignment.sdrName,
        fromQueue: true,
      };
    }
    console.warn("[sdr-queue] Fila vazia: usando CLOSER_CALENDAR_EMAIL", { leadKey: lead.leadKey });
  } catch (err) {
    console.error("[sdr-queue] Falha ao pedir SDR à fila, usando CLOSER_CALENDAR_EMAIL:", err);
  }
  return fallbackSdr();
}

// Agendas onde a reunião do lead pode estar. Com AGENDA_ORGANIZER_EMAIL todo evento nasce nela;
// sem ela, nasce na agenda do SDR: a do SDR que a fila deu ao lead e a fixa (eventos de antes da
// fila e os criados no fallback).
async function agendaCalendars(leadKey: string): Promise<string[]> {
  const organizer = process.env.AGENDA_ORGANIZER_EMAIL?.trim();
  if (organizer) return [organizer];

  const calendars = new Set<string>();
  const assigned = await erpApi
    .findSdrAssignment(leadKey, LOOKUP_TIMEOUT_MS)
    .then((r) => r.assignment?.sdrEmail ?? null)
    .catch((err) => {
      console.error("[sdr-queue] Falha ao consultar o SDR do lead:", err);
      return null;
    });
  if (assigned) calendars.add(assigned.toLowerCase());
  const fallback = process.env.CLOSER_CALENDAR_EMAIL?.trim().toLowerCase();
  if (fallback) calendars.add(fallback);
  return [...calendars];
}

// Reunião já marcada por esse lead, em qualquer agenda possível. Uma agenda com erro (ex.: SDR
// que saiu do Workspace) não derruba a checagem; só falha se nenhuma agenda respondeu.
export async function findLeadEventInAgendas(leadKey: string) {
  const calendars = await agendaCalendars(leadKey);
  let lastError: unknown = null;
  let answered = 0;
  for (const email of calendars) {
    try {
      const event = await findLeadEvent(email, leadKey);
      answered++;
      if (event) return event;
    } catch (err) {
      lastError = err;
      console.error("[sdr-queue] Falha ao consultar agenda", { email, err });
    }
  }
  if (calendars.length > 0 && answered === 0) throw lastError;
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
