import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAgenda, isGridSlot } from "@/lib/agendamento";

// Horário de Brasília (-03:00, sem horário de verão). 16/11/2026 é uma segunda.
const at = (iso: string) => new Date(`${iso}-03:00`);

function summary(now: Date) {
  return buildAgenda(now).map((d) => ({
    label: d.label,
    periods: Object.fromEntries(d.periods.map((p) => [p.id, p.slots.map((s) => s.label)])),
  }));
}

const labels = (now: Date) => summary(now).map((d) => d.label);

const MANHA = ["08:00", "09:00", "10:00", "11:00"];
const TARDE = ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

test("segunda 10h → SEG (a partir de 11:00) e TER completa", () => {
  const days = summary(at("2026-11-16T10:00"));
  assert.deepEqual(
    days.map((d) => d.label),
    ["SEG 16/Nov", "TER 17/Nov"]
  );
  assert.deepEqual(days[0].periods, { manha: ["11:00"], tarde: TARDE });
  assert.deepEqual(days[1].periods, { manha: MANHA, tarde: TARDE });
});

test("segunda 19h → só TER (não puxa a quarta)", () => {
  assert.deepEqual(labels(at("2026-11-16T19:00")), ["TER 17/Nov"]);
});

test("segunda 18:00 (último horário já passou da antecedência) → só TER", () => {
  assert.deepEqual(labels(at("2026-11-16T17:31")), ["TER 17/Nov"]);
  assert.deepEqual(labels(at("2026-11-16T17:30")), ["SEG 16/Nov", "TER 17/Nov"]);
});

test("sábado 10h → só SEG", () => {
  assert.deepEqual(labels(at("2026-11-21T10:00")), ["SEG 23/Nov"]);
});

test("sábado 19h → só SEG", () => {
  assert.deepEqual(labels(at("2026-11-21T19:00")), ["SEG 23/Nov"]);
});

test("domingo → só SEG", () => {
  assert.deepEqual(labels(at("2026-11-22T10:00")), ["SEG 23/Nov"]);
  assert.deepEqual(labels(at("2026-11-22T23:00")), ["SEG 23/Nov"]);
});

test("nunca mais de 2 dias, a qualquer hora da semana", () => {
  for (let d = 15; d <= 22; d++) {
    for (let h = 0; h < 24; h++) {
      const days = labels(at(`2026-11-${d}T${String(h).padStart(2, "0")}:00`));
      assert.ok(days.length >= 1 && days.length <= 2, `${d}/11 ${h}h → ${days.join(", ")}`);
    }
  }
});

test("só dois períodos (Manhã e Tarde), nenhum slot antes de 08:00 nem começando depois de 18:30", () => {
  const days = buildAgenda(at("2026-11-16T06:00"));
  for (const day of days) {
    assert.deepEqual(
      day.periods.map((p) => p.id),
      ["manha", "tarde"]
    );
    for (const slot of day.periods.flatMap((p) => p.slots)) {
      assert.ok(slot.label >= "08:00", slot.label);
      assert.ok(slot.label <= "18:30", slot.label);
    }
  }
  assert.deepEqual(summary(at("2026-11-16T06:00"))[0].periods, { manha: MANHA, tarde: TARDE });
});

test("isGridSlot aceita horários de hoje e do próximo dia útil", () => {
  const now = at("2026-11-16T10:00");
  assert.equal(isGridSlot(at("2026-11-16T11:00"), now), true);
  assert.equal(isGridSlot(at("2026-11-16T18:00"), now), true);
  assert.equal(isGridSlot(at("2026-11-17T08:00"), now), true);
  assert.equal(isGridSlot(at("2026-11-17T18:00"), now), true);
  assert.equal(isGridSlot(at("2026-11-23T08:00"), at("2026-11-21T10:00")), true);
  assert.equal(isGridSlot(at("2026-11-23T08:00"), at("2026-11-22T10:00")), true);
  assert.equal(isGridSlot(at("2026-11-21T10:00"), at("2026-11-20T10:00")), false);
});

test("isGridSlot recusa o 3º dia, mesmo quando hoje já não tem horário", () => {
  assert.equal(isGridSlot(at("2026-11-18T10:00"), at("2026-11-16T10:00")), false);
  assert.equal(isGridSlot(at("2026-11-18T10:00"), at("2026-11-16T19:00")), false);
  assert.equal(isGridSlot(at("2026-11-24T10:00"), at("2026-11-21T10:00")), false);
  assert.equal(isGridSlot(at("2026-11-24T10:00"), at("2026-11-22T10:00")), false);
});

test("isGridSlot recusa 19:00, noite, almoço, antes das 8h, fora de :00, domingo e < agora+30min", () => {
  const now = at("2026-11-16T10:00");
  assert.equal(isGridSlot(at("2026-11-17T19:00"), now), false);
  assert.equal(isGridSlot(at("2026-11-17T18:30"), now), false);
  assert.equal(isGridSlot(at("2026-11-17T20:00"), now), false);
  assert.equal(isGridSlot(at("2026-11-17T12:00"), now), false);
  assert.equal(isGridSlot(at("2026-11-17T07:00"), now), false);
  assert.equal(isGridSlot(at("2026-11-17T09:15"), now), false);
  assert.equal(isGridSlot(at("2026-11-22T10:00"), at("2026-11-20T10:00")), false);
  assert.equal(isGridSlot(at("2026-11-16T10:00"), now), false);
  assert.equal(isGridSlot(at("2026-11-16T11:00"), at("2026-11-16T10:31")), false);
  assert.equal(isGridSlot(new Date("invalid"), now), false);
});
