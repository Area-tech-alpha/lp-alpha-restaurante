import { agendamentoConfig, type AgendamentoConfig } from "@/lib/agendamento-config";
import { hasAgendamento } from "@/lib/variants";

// Regras de grade/dias da página /[variant]/agendamento. Sem I/O: recebe "agora"
// e os intervalos ocupados, para ser usado tanto no GET de slots quanto na
// validação do POST.

export type BusyInterval = { start: Date; end: Date };
export type Slot = { start: string; label: string };
export type AgendaDay = { date: string; label: string; slots: Slot[] };

// Destino depois do submit do formulário. Hoje só leads qualificados de
// variações com agendamento vão escolher horário — regra isolada aqui porque
// deve mudar. Retorna null para manter o destino padrão (/obrigado ou /agradecimento).
export function agendamentoPathAposCadastro(params: {
  variant: string | null | undefined;
  qualified: boolean;
}): string | null {
  if (!params.variant || !hasAgendamento(params.variant)) return null;
  if (!params.qualified) return null;
  return `/${params.variant}/agendamento`;
}

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type CivilDate = { y: number; m: number; d: number };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseHHMM(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), min: get("minute"), s: get("second") };
}

// Offset genérico via Intl (não assume -03:00 fixo) para a timezone poder mudar no config.
function offsetMinutes(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  return (Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - date.getTime()) / 60000;
}

function zonedToUtc(day: CivilDate, minutesOfDay: number, timeZone: string) {
  const guess = Date.UTC(day.y, day.m - 1, day.d, 0, minutesOfDay);
  return new Date(guess - offsetMinutes(new Date(guess), timeZone) * 60000);
}

function addDays(day: CivilDate, n: number): CivilDate {
  const dt = new Date(Date.UTC(day.y, day.m - 1, day.d + n));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function weekday(day: CivilDate) {
  return new Date(Date.UTC(day.y, day.m - 1, day.d)).getUTCDay();
}

function slotMinutesOfDay(config: AgendamentoConfig) {
  const first = parseHHMM(config.firstSlot);
  const last = parseHHMM(config.lastSlotStart);
  const out: number[] = [];
  for (let t = first; t <= last; t += config.slotMinutes) out.push(t);
  return out;
}

// Dias úteis candidatos, a partir de amanhã (hoje nunca entra).
function candidateDays(now: Date, config: AgendamentoConfig): CivilDate[] {
  const today = zonedParts(now, config.timezone);
  const out: CivilDate[] = [];
  for (let i = 1; i <= config.maxLookaheadDays; i++) {
    const day = addDays(today, i);
    if (!(config.businessDays as readonly number[]).includes(weekday(day))) continue;
    if (config.holidays.includes(`${day.y}-${pad(day.m)}-${pad(day.d)}`)) continue;
    out.push(day);
  }
  return out;
}

function overlaps(start: Date, end: Date, busy: BusyInterval[]) {
  return busy.some((b) => start < b.end && end > b.start);
}

export function meetingEnd(start: Date, config: AgendamentoConfig = agendamentoConfig) {
  return new Date(start.getTime() + config.meetingMinutes * 60000);
}

// Janela que o GET de slots precisa consultar no freebusy.
export function lookaheadWindow(now: Date, config: AgendamentoConfig = agendamentoConfig) {
  const days = candidateDays(now, config);
  const first = days[0];
  const last = days[days.length - 1];
  return {
    timeMin: zonedToUtc(first, 0, config.timezone),
    timeMax: zonedToUtc(addDays(last, 1), 0, config.timezone),
  };
}

export function buildAgenda(
  now: Date,
  busy: BusyInterval[],
  config: AgendamentoConfig = agendamentoConfig
): AgendaDay[] {
  const grid = slotMinutesOfDay(config);
  const days: AgendaDay[] = [];

  for (const day of candidateDays(now, config)) {
    const slots: Slot[] = [];
    for (const minutes of grid) {
      const start = zonedToUtc(day, minutes, config.timezone);
      if (start <= now) continue;
      if (overlaps(start, meetingEnd(start, config), busy)) continue;
      slots.push({ start: start.toISOString(), label: `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}` });
    }
    if (slots.length === 0) continue;
    days.push({
      date: `${day.y}-${pad(day.m)}-${pad(day.d)}`,
      label: `${WEEKDAYS[weekday(day)]} ${pad(day.d)}/${MONTHS[day.m - 1]}`,
      slots,
    });
    if (days.length === config.daysToShow) break;
  }

  return days;
}

// Validação estrutural do POST: o horário pertence à grade de um dia útil
// futuro dentro da janela? A ocupação é checada à parte, no freebusy.
export function isGridSlot(start: Date, now: Date, config: AgendamentoConfig = agendamentoConfig) {
  if (Number.isNaN(start.getTime()) || start <= now) return false;
  const grid = slotMinutesOfDay(config);
  return candidateDays(now, config).some((day) =>
    grid.some((minutes) => zonedToUtc(day, minutes, config.timezone).getTime() === start.getTime())
  );
}

export function formatSlot(start: Date, config: AgendamentoConfig = agendamentoConfig) {
  const p = zonedParts(start, config.timezone);
  const day: CivilDate = { y: p.y, m: p.m, d: p.d };
  return {
    date: `${WEEKDAYS[weekday(day)]} ${pad(p.d)}/${MONTHS[p.m - 1]}`,
    time: `${pad(p.h)}:${pad(p.min)}`,
  };
}
