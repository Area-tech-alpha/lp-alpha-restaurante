import { JWT } from "google-auth-library";
import type { BusyInterval } from "@/lib/agendamento";

// Service Account com Domain-Wide Delegation impersonando o closer (subject):
// o evento nasce NA agenda dele, com ele como organizer. Passo a passo de
// configuração em docs/AGENDAMENTO.md.
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
];

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

type FreeBusyResponse = {
  calendars: Record<string, { busy?: { start: string; end: string }[]; errors?: { reason: string }[] }>;
};

export async function queryFreeBusy(
  calendarEmail: string,
  timeMin: Date,
  timeMax: Date
): Promise<BusyInterval[]> {
  const data = await calendarFetch<FreeBusyResponse>(calendarEmail, "/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarEmail }],
    }),
  });
  const calendar = data.calendars[calendarEmail];
  // Erro por calendário vem com 200; tratar como "tudo livre" poderia marcar em cima de reunião.
  if (!calendar || calendar.errors?.length) {
    throw new GoogleCalendarError(`freeBusy sem acesso ao calendário: ${JSON.stringify(calendar?.errors)}`);
  }
  return (calendar.busy ?? []).map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

type InsertEventInput = {
  organizerEmail: string;
  summary: string;
  description: string;
  start: Date;
  end: Date;
  timezone: string;
  attendee: { email: string; displayName: string };
  requestId: string;
  sendUpdates: string;
};

type CalendarEvent = {
  id: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
};

export async function insertEvent(input: InsertEventInput) {
  const params = new URLSearchParams({ conferenceDataVersion: "1", sendUpdates: input.sendUpdates });
  const event = await calendarFetch<CalendarEvent>(
    input.organizerEmail,
    `/calendars/primary/events?${params}`,
    {
      method: "POST",
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.start.toISOString(), timeZone: input.timezone },
        end: { dateTime: input.end.toISOString(), timeZone: input.timezone },
        attendees: [input.attendee],
        conferenceData: {
          // requestId idempotente: retry do mesmo lead não cria duas salas do Meet.
          createRequest: { requestId: input.requestId, conferenceSolutionKey: { type: "hangoutsMeet" } },
        },
      }),
    }
  );
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
