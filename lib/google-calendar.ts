import { createHash } from "node:crypto";
import { JWT } from "google-auth-library";

// Service Account com Domain-Wide Delegation impersonando o organizer (subject):
// o SDR da vez (lib/sdr-queue.ts) ou, se definida, a conta genérica AGENDA_ORGANIZER_EMAIL.
// Passo a passo de configuração em docs/AGENDAMENTO.md.
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

const API = "https://www.googleapis.com/calendar/v3";

export class GoogleCalendarError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

// A conta impersonada não existe mais (apagada ou suspensa no Workspace): o Google recusa o token
// com invalid_grant. Em 11/11/2026 a conta do Yoshio foi apagada e todo agendamento da lp-09
// passou a falhar. Quem chama troca de agenda em vez de derrubar o agendamento.
export class GoogleCalendarAccountError extends GoogleCalendarError {
  constructor(readonly email: string, cause: unknown) {
    super(`Conta do Google indisponível para ${email}: ${String((cause as Error)?.message ?? cause).slice(0, 300)}`);
  }
}

export function isCalendarAccountError(err: unknown): err is GoogleCalendarAccountError {
  return err instanceof GoogleCalendarAccountError;
}

// Agenda fixa: fallback da fila de SDRs (fila vazia ou Dashcom fora) e agenda dos eventos de
// antes da fila. null = sem agenda fixa (o agendamento depende só da fila).
export function getCloserEmail(): string | null {
  return process.env.CLOSER_CALENDAR_EMAIL?.trim() || null;
}

// Agenda onde o evento nasce (organizer). Com AGENDA_ORGANIZER_EMAIL (conta genérica
// do Workspace), o lead vê só ela no convite e o SDR entra como convidado oculto;
// sem ela, o SDR é o organizer (comportamento original).
export function getAgendaOrganizer(sdrEmail: string) {
  const organizer = process.env.AGENDA_ORGANIZER_EMAIL?.trim();
  return organizer && organizer.toLowerCase() !== sdrEmail.toLowerCase()
    ? { organizerEmail: organizer, hostEmail: sdrEmail as string | null }
    : { organizerEmail: sdrEmail, hostEmail: null };
}

let client: JWT | null = null;
let clientSubject: string | null = null;

function getClient(subject: string) {
  if (client && clientSubject === subject) return client;
  const email = process.env.GOOGLE_SA_CLIENT_EMAIL;
  // Na Vercel a chave costuma ser colada com "\n" literais no lugar das quebras.
  const key = process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new GoogleCalendarError("GOOGLE_SA_CLIENT_EMAIL / GOOGLE_SA_PRIVATE_KEY não definidas");
  }
  client = new JWT({ email, key, scopes: SCOPES, subject });
  clientSubject = subject;
  return client;
}

function isInvalidGrant(err: unknown) {
  const e = err as { message?: string; response?: { data?: { error?: string } } };
  return e?.response?.data?.error === "invalid_grant" || /invalid_grant/i.test(String(e?.message ?? ""));
}

async function accessToken(subject: string) {
  try {
    const { token } = await getClient(subject).getAccessToken();
    return token;
  } catch (err) {
    if (isInvalidGrant(err)) throw new GoogleCalendarAccountError(subject, err);
    throw err;
  }
}

// A conta ainda existe no Workspace? Com AGENDA_ORGANIZER_EMAIL o SDR entra só como convidado, e
// o Google cria o evento mesmo se a conta dele tiver sido apagada (reunião sem ninguém).
// Lança GoogleCalendarAccountError quando a conta não serve.
export async function assertCalendarAccount(email: string) {
  await accessToken(email);
}

async function calendarFetch<T>(subject: string, path: string, init: RequestInit): Promise<T> {
  const token = await accessToken(subject);
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GoogleCalendarError(`Calendar API ${res.status}: ${body.slice(0, 500)}`, res.status);
  }
  return res.json() as Promise<T>;
}

type InsertEventInput = {
  organizerEmail: string;
  // Closer como convidado quando o organizer é a conta genérica (getAgendaOrganizer).
  hostEmail: string | null;
  summary: string;
  description: string;
  start: Date;
  end: Date;
  timezone: string;
  attendee: { email: string; displayName: string };
  leadKey: string;
  sendUpdates: string;
};

type CalendarEvent = {
  id: string;
  status?: string;
  start?: { dateTime?: string };
  hangoutLink?: string;
  conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
};

// Id do evento derivado do lead (o Google aceita ids próprios em base32hex):
// um segundo insert do mesmo lead volta 409 em vez de criar outra reunião.
// Isso substitui a trava que antes ficava no banco.
function eventIdFor(leadKey: string) {
  return `lp${createHash("sha256").update(leadKey).digest("hex").slice(0, 40)}`;
}

export class EventAlreadyExistsError extends Error {}

// Reunião já marcada por esse lead (se houver), para a página mostrar
// "você já tem uma reunião" em vez da grade.
// `includeCancelled`: no fluxo do leilão (lib/agendamento-leilao.ts) o evento sai da conta genérica
// quando a reunião vai para a agenda de quem ficou com o lead, e ainda conta como agendado.
export async function findLeadEvent(
  organizerEmail: string,
  leadKey: string,
  options: { includeCancelled?: boolean } = {}
): Promise<{ id: string; start: Date | null } | null> {
  try {
    const event = await calendarFetch<CalendarEvent>(
      organizerEmail,
      `/calendars/primary/events/${eventIdFor(leadKey)}`,
      { method: "GET" }
    );
    if (event.status === "cancelled" && options.includeCancelled) {
      return { id: event.id, start: event.start?.dateTime ? new Date(event.start.dateTime) : null };
    }
    if (event.status === "cancelled" || !event.start?.dateTime) return null;
    return { id: event.id, start: new Date(event.start.dateTime) };
  } catch (err) {
    if (err instanceof GoogleCalendarError && (err.status === 404 || err.status === 410)) return null;
    throw err;
  }
}

export async function insertEvent(input: InsertEventInput) {
  const params = new URLSearchParams({ conferenceDataVersion: "1", sendUpdates: input.sendUpdates });
  const id = eventIdFor(input.leadKey);
  const event = await calendarFetch<CalendarEvent>(
    input.organizerEmail,
    `/calendars/primary/events?${params}`,
    {
      method: "POST",
      body: JSON.stringify({
        id,
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.start.toISOString(), timeZone: input.timezone },
        end: { dateTime: input.end.toISOString(), timeZone: input.timezone },
        attendees: [
          input.attendee,
          ...(input.hostEmail ? [{ email: input.hostEmail, responseStatus: "accepted" }] : []),
        ],
        ...(input.hostEmail && { guestsCanSeeOtherGuests: false, guestsCanInviteOthers: false }),
        conferenceData: {
          // requestId idempotente: retry do mesmo lead não cria duas salas do Meet.
          createRequest: { requestId: id, conferenceSolutionKey: { type: "hangoutsMeet" } },
        },
      }),
    }
  ).catch((err) => {
    if (err instanceof GoogleCalendarError && err.status === 409) throw new EventAlreadyExistsError();
    throw err;
  });
  const meetLink =
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ??
    null;
  return { id: event.id, meetLink };
}

export function buildMeetingTitle(empresa: string) {
  const prefix = process.env.MEETING_TITLE_PREFIX || "Consultoria";
  // O sufixo " - <data> GMT-03:00 - Recording" é adicionado pelo Google na gravação do Meet.
  return `${prefix}: ${empresa}`;
}
