"use client";

import { useSyncExternalStore } from "react";

// America/São_Paulo não tem horário de verão: UTC-3 fixo.
const SP_OFFSET_MS = 3 * 60 * 60 * 1000;

function msUntilEndOfMonth(): number {
  const spNow = new Date(Date.now() - SP_OFFSET_MS);
  const endUtc = Date.UTC(spNow.getUTCFullYear(), spNow.getUTCMonth() + 1, 1, 0, 0, 0);
  return Math.max(0, endUtc + SP_OFFSET_MS - Date.now());
}

function split(ms: number) {
  const total = Math.floor(ms / 1000);
  return [
    { value: Math.floor(total / 86400), label: "Dias" },
    { value: Math.floor((total % 86400) / 3600), label: "Horas" },
    { value: Math.floor((total % 3600) / 60), label: "Minutos" },
    { value: total % 60, label: "Segundos" },
  ];
}

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}

const getSnapshot = () => Math.floor(msUntilEndOfMonth() / 1000);

export default function CountdownBar({ label }: { label: string }) {
  // Snapshot de servidor null: o valor depende do relógio, então SSR renderiza
  // "--" e o cliente assume depois da hidratação, sem mismatch.
  const seconds = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const ms = seconds === null ? null : seconds * 1000;

  const parts = split(ms ?? 0);

  return (
    <div
      role="timer"
      aria-label={label}
      className="sticky top-0 z-[1000] bg-lp-gold-1 px-3 py-2.5 text-lp-on-gold"
    >
      <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-center gap-1.5 sm:flex-row sm:gap-6">
        <span className="text-center text-[11px] font-bold tracking-[.12em] uppercase sm:text-xs">
          {label}
        </span>
        <div className="flex items-start gap-3 sm:gap-4">
          {parts.map((p) => (
            <div key={p.label} className="flex min-w-[44px] flex-col items-center leading-none">
              <span className="font-lp-display text-2xl font-bold tabular-nums sm:text-[28px]">
                {ms === null ? "--" : String(p.value).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[9px] font-bold tracking-[.1em] uppercase">
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
