"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarCheck, ChevronDown, Loader2 } from "lucide-react";
import { content } from "@/lib/content";
import { clarityEvent } from "@/lib/clarity";
import type { AgendaDay } from "@/lib/agendamento";
import type { PeriodId } from "@/lib/agendamento-config";

const { pagina: c } = content.agendamento;

type Confirmed = { date: string; time: string };

type State =
  | { kind: "loading" }
  | { kind: "ready"; days: AgendaDay[] }
  | { kind: "done"; confirmed: Confirmed; already: boolean }
  | { kind: "fatal"; message: string; retry: boolean };

async function fetchAgenda(token: string | null): Promise<State> {
  if (!token) return { kind: "fatal", message: c.errors.leadNotFound, retry: false };
  try {
    const res = await fetch(`/api/agendamento/slots?t=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    if (res.status === 404 || res.status === 400) {
      return { kind: "fatal", message: c.errors.leadNotFound, retry: false };
    }
    if (!res.ok) return { kind: "fatal", message: c.errors.load, retry: true };
    const data = await res.json();
    if (data.alreadyScheduled) return { kind: "done", confirmed: data.confirmed, already: true };
    return { kind: "ready", days: data.days };
  } catch {
    return { kind: "fatal", message: c.errors.load, retry: true };
  }
}

export default function AgendamentoPicker() {
  // Dados do lead criptografados pelo submit-lead (lib/agendamento-token.ts).
  const token = useSearchParams().get("t");
  const [state, setState] = useState<State>({ kind: "loading" });
  const [activeDay, setActiveDay] = useState(0);
  const [openPeriod, setOpenPeriod] = useState<PeriodId | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    setSelected(null);
    setActiveDay(0);
    setOpenPeriod(null);
    setState(await fetchAgenda(token));
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    fetchAgenda(token).then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function confirm() {
    if (!selected || !token) return;
    setSubmitting(true);
    setNotice("");
    try {
      const res = await fetch("/api/agendamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, start: selected }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        clarityEvent("agendamento_confirmado");
        setState({ kind: "done", confirmed: data.confirmed, already: false });
      } else if (data.error === "invalid_slot") {
        setNotice(c.errors.slotUnavailable);
        await load();
      } else if (data.error === "already_scheduled") {
        await load();
      } else if (data.error === "rate_limited") {
        setNotice(c.errors.rateLimited);
      } else if (data.error === "lead_not_found") {
        setState({ kind: "fatal", message: c.errors.leadNotFound, retry: false });
      } else {
        setNotice(c.errors.generic);
      }
    } catch {
      setNotice(c.errors.generic);
    } finally {
      setSubmitting(false);
    }
  }

  if (state.kind === "loading") {
    return (
      <p role="status" className="flex items-center justify-center gap-2 py-10 text-lp-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {c.loading}
      </p>
    );
  }

  if (state.kind === "fatal") {
    return (
      <div role="alert" className="py-8 text-center">
        <p className="text-lp-text">{state.message}</p>
        {state.retry && (
          <button
            type="button"
            onClick={load}
            className="mt-4 rounded-full border border-lp-border-gold px-5 py-2 text-sm font-semibold text-lp-gold-1 hover:bg-lp-gold-2/10"
          >
            {c.errors.retry}
          </button>
        )}
      </div>
    );
  }

  if (state.kind === "done") {
    return (
      <div role="status" className="flex flex-col items-center py-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-lp-gold-1 to-lp-gold-2">
          <CalendarCheck className="h-7 w-7 text-lp-on-gold" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-xl font-semibold text-lp-ink">
          {state.already ? c.alreadyScheduledTitle : c.successTitle}
        </h3>
        <p className="mt-2 font-lp-heading text-2xl font-bold text-lp-gold-1">
          {state.confirmed.date} · {state.confirmed.time}
        </p>
        <p className="mt-1 text-[13px] text-lp-text-dim">{c.timezoneLabel}</p>
        {!state.already && <p className="mt-4 max-w-[420px] text-sm text-lp-text-muted">{c.successText}</p>}
      </div>
    );
  }

  const { days } = state;
  if (days.length === 0) {
    return <p className="py-10 text-center text-lp-text-muted">{c.empty}</p>;
  }

  const day = days[Math.min(activeDay, days.length - 1)];
  const selectedSlot = days
    .flatMap((d) => d.periods.flatMap((p) => p.slots.map((s) => ({ ...s, day: d.label }))))
    .find((s) => s.start === selected);

  return (
    <div>
      {notice && (
        <p role="alert" className="mb-4 rounded-xl border border-lp-border-gold bg-lp-gold-2/10 px-4 py-3 text-sm text-lp-text">
          {notice}
        </p>
      )}

      <div role="tablist" aria-label={c.cardTitle} className="grid grid-cols-3 gap-2">
        {days.map((d, i) => {
          const active = d.date === day.date;
          return (
            <button
              key={d.date}
              type="button"
              role="tab"
              id={`tab-${d.date}`}
              aria-selected={active}
              aria-controls="agendamento-slots"
              onClick={() => {
                setActiveDay(i);
                setOpenPeriod(null);
              }}
              className={`rounded-xl border px-2 py-3 font-lp-heading text-[14px] font-bold tracking-[.03em] transition-colors ${
                active
                  ? "border-lp-gold-2 bg-gradient-to-br from-lp-gold-1 to-lp-gold-2 text-lp-on-gold"
                  : "border-lp-border bg-lp-panel text-lp-text hover:border-lp-border-gold"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      <div id="agendamento-slots" role="tabpanel" aria-labelledby={`tab-${day.date}`} className="mt-5 flex flex-col gap-2">
        {day.periods.map((period) => {
          const count = period.slots.length;
          const available = count > 0;
          const open = available && openPeriod === period.id;
          const panelId = `periodo-${day.date}-${period.id}`;
          return (
            <div
              key={period.id}
              className={`rounded-xl border transition-colors ${
                open ? "border-lp-border-gold bg-lp-panel" : "border-lp-border bg-lp-panel"
              }`}
            >
              <h3>
                <button
                  type="button"
                  id={`${panelId}-botao`}
                  aria-expanded={open}
                  aria-controls={panelId}
                  disabled={!available}
                  onClick={() => setOpenPeriod(open ? null : period.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="font-lp-heading text-[15px] font-bold text-lp-ink">{c.periodos[period.id]}</span>
                  <span className="flex items-center gap-2 text-[13px] text-lp-text-muted">
                    {available
                      ? `${count} ${count === 1 ? c.periodoHorario.singular : c.periodoHorario.plural}`
                      : c.periodoIndisponivel}
                    {available && (
                      <ChevronDown
                        className={`h-4 w-4 text-lp-gold-1 transition-transform ${open ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </button>
              </h3>
              {open && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={`${panelId}-botao`}
                  className="grid grid-cols-3 gap-2 px-4 pb-4 sm:grid-cols-4 md:grid-cols-5"
                >
                  {period.slots.map((slot) => {
                    const isSelected = slot.start === selected;
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelected(slot.start)}
                        className={`rounded-lg border py-2.5 text-[14px] font-semibold tabular-nums transition-colors ${
                          isSelected
                            ? "border-lp-gold-1 bg-lp-gold-2/15 text-lp-gold-1"
                            : "border-lp-border bg-lp-panel text-lp-text hover:border-lp-border-gold"
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 border-t border-lp-border pt-5 sm:flex-row sm:justify-between">
        <p className="text-sm text-lp-text-muted" aria-live="polite">
          {selectedSlot && (
            <>
              {c.selectedLabel}{" "}
              <strong className="text-lp-ink">
                {selectedSlot.day} · {selectedSlot.label}
              </strong>
            </>
          )}
        </p>
        <button
          type="button"
          onClick={confirm}
          disabled={!selected || submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-lp-gold-1 to-lp-gold-2 px-7 py-3.5 font-lp-heading text-[15px] font-bold text-lp-on-gold shadow-[0_10px_30px_rgba(245,166,35,0.3)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitting ? c.confirming : c.confirm}
        </button>
      </div>
    </div>
  );
}
