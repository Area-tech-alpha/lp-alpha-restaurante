import { agendamentoConfig, type AgendamentoConfig, type PeriodId } from "@/lib/agendamento-config";
import { hasAgendamento } from "@/lib/variants";

// Regras de grade/dias da página /[variant]/agendamento. Sem I/O: recebe "agora",
// para ser usado tanto no GET de slots quanto na validação do POST.

export type Slot = { start: string; label: string };
export type AgendaPeriod = { id: PeriodId; slots: Slot[] };
export type AgendaDay = { date: string; label: string; periods: AgendaPeriod[] };

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

function dateKey(day: CivilDate) {
  return `${day.y}-${pad(day.m)}-${pad(day.d)}`;
}

// Minutos do dia (no fuso da agenda) de cada horário de cada período, sem filtro de "agora".
function periodSlots(config: AgendamentoConfig) {
  return config.periods.map((period) => {
    const minutes: number[] = [];
    for (let t = parseHHMM(period.start); t + config.slotMinutes <= parseHHMM(period.end); t += config.slotMinutes) {
      minutes.push(t);
    }
    return { id: period.id, minutes };
  });
}

// Dias candidatos (seg a sáb), a partir de HOJE.
function candidateDays(now: Date, config: AgendamentoConfig): CivilDate[] {
  const p = zonedParts(now, config.timezone);
  const today: CivilDate = { y: p.y, m: p.m, d: p.d };
  const out: CivilDate[] = [];
  for (let i = 0; i <= config.maxLookaheadDays; i++) {
    const day = addDays(today, i);
    if (!(config.businessDays as readonly number[]).includes(weekday(day))) continue;
    if (config.holidays.includes(dateKey(day))) continue;
    out.push(day);
  }
  return out;
}

function earliestStart(now: Date, config: AgendamentoConfig) {
  return new Date(now.getTime() + config.minNoticeMinutes * 60000);
}

export function meetingEnd(start: Date, config: AgendamentoConfig = agendamentoConfig) {
  return new Date(start.getTime() + config.meetingMinutes * 60000);
}

// Sem checagem de agenda ocupada: vários leads podem marcar o mesmo horário.
export function buildAgenda(now: Date, config: AgendamentoConfig = agendamentoConfig): AgendaDay[] {
  const minStart = earliestStart(now, config);
  const days: AgendaDay[] = [];

  for (const day of candidateDays(now, config)) {
    const periods = periodSlots(config).map(({ id, minutes }) => ({
      id,
      slots: minutes.flatMap((m): Slot[] => {
        const start = zonedToUtc(day, m, config.timezone);
        if (start < minStart) return [];
        return [{ start: start.toISOString(), label: `${pad(Math.floor(m / 60))}:${pad(m % 60)}` }];
      }),
    }));
    // Hoje sem nenhum horário restante (ex.: 21:45) não ocupa uma das abas.
    if (periods.every((p) => p.slots.length === 0)) continue;
    days.push({
      date: dateKey(day),
      label: `${WEEKDAYS[weekday(day)]} ${pad(day.d)}/${MONTHS[day.m - 1]}`,
      periods,
    });
    if (days.length === config.daysToShow) break;
  }

  return days;
}

// Validação do POST: o horário pertence à grade de um dia de seg a sáb dentro da
// janela e começa em >= agora + minNoticeMinutes?
export function isGridSlot(start: Date, now: Date, config: AgendamentoConfig = agendamentoConfig) {
  if (Number.isNaN(start.getTime()) || start < earliestStart(now, config)) return false;
  const grid = periodSlots(config).flatMap((p) => p.minutes);
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
