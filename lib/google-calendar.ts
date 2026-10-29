import { createHash } from "node:crypto";
import { JWT } from "google-auth-library";

// Service Account com Domain-Wide Delegation impersonando o closer (subject):
// o evento nasce NA agenda dele, com ele como organizer. Passo a passo de
// configuração em docs/AGENDAMENTO.md.
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

const API = "https://www.googleapis.com/calendar/v3";

export class GoogleCalendarError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

export function getCloserEmail() {
  const email = process.env.CLOSER_CALENDAR_EMAIL;
  if (!email) throw new GoogleCalendarError("CLOSER_CALENDAR_EMAIL não definida");
  return email;
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

async function calendarFetch<T>(subject: string, path: string, init: RequestInit): Promise<T> {
  const { token } = await getClient(subject).getAccessToken();
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
export async function findLeadEvent(organizerEmail: string, leadKey: string) {
  try {
    const event = await calendarFetch<CalendarEvent>(
      organizerEmail,
      `/calendars/primary/events/${eventIdFor(leadKey)}`,
      { method: "GET" }
    );
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
        attendees: [input.attendee],
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
  const initial = process.env.CLOSER_INITIAL || "";
  // O sufixo " - <data> GMT-03:00 - Recording" é adicionado pelo Google na gravação do Meet.
  return initial ? `${prefix}: ${initial} | ${empresa}` : `${prefix}: ${empresa}`;
}
