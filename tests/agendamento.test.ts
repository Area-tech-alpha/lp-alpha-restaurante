import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAgenda, isGridSlot } from "@/lib/agendamento";

// Horário de Brasília (-03:00, sem horário de verão). 29/10/2026 é uma quinta.
const at = (iso: string) => new Date(`${iso}-03:00`);

function summary(now: Date) {
  return buildAgenda(now).map((d) => ({
    label: d.label,
    periods: Object.fromEntries(d.periods.map((p) => [p.id, p.slots.map((s) => s.label)])),
  }));
}

const MANHA = ["08:00", "09:00", "10:00", "11:00"];
const TARDE = ["13:00", "14:00", "15:00", "16:00", "17:00"];
const NOITE = ["18:00", "19:00", "20:00", "21:00"];

test("hoje qui 17:05 → QUI só com Noite a partir de 18:00, depois SEX e SÁB completos", () => {
  const days = summary(at("2026-10-29T17:05"));
  assert.deepEqual(
    days.map((d) => d.label),
    ["QUI 29/Out", "SEX 30/Out", "SÁB 31/Out"]
  );
  assert.deepEqual(days[0].periods, { manha: [], tarde: [], noite: NOITE });
  assert.deepEqual(days[1].periods, { manha: MANHA, tarde: TARDE, noite: NOITE });
});

test("hoje 07:00 → Manhã a partir de 08:00", () => {
  const [today] = summary(at("2026-10-29T07:00"));
  assert.equal(today.label, "QUI 29/Out");
  assert.deepEqual(today.periods, { manha: MANHA, tarde: TARDE, noite: NOITE });
});

test("antecedência de 30 min: 07:31 tira 08:00, 17:00 não mostra outro horário à tarde", () => {
  assert.equal(summary(at("2026-10-29T07:31"))[0].periods.manha[0], "09:00");
  assert.deepEqual(summary(at("2026-10-29T17:00"))[0].periods.tarde, []);
});

test("num domingo → SEG, TER, QUA", () => {
  assert.deepEqual(
    summary(at("2026-11-01T10:00")).map((d) => d.label),
    ["SEG 02/Nov", "TER 03/Nov", "QUA 04/Nov"]
  );
});

test("hoje sem horário restante (21:45) não ocupa uma aba", () => {
  assert.deepEqual(
    summary(at("2026-10-29T21:45")).map((d) => d.label),
    ["SEX 30/Out", "SÁB 31/Out", "SEG 02/Nov"]
  );
});

test("isGridSlot aceita horários válidos da grade", () => {
  const now = at("2026-10-29T17:05");
  assert.equal(isGridSlot(at("2026-10-29T18:00"), now), true);
  assert.equal(isGridSlot(at("2026-10-30T08:00"), now), true);
  assert.equal(isGridSlot(at("2026-10-30T17:00"), now), true);
  assert.equal(isGridSlot(at("2026-10-30T21:00"), now), true);
  assert.equal(isGridSlot(at("2026-10-29T18:00"), at("2026-10-29T17:00")), true);
});

test("isGridSlot rejeita 12:00, 12:30, 22:00, fora de :00, domingo e < agora+30min", () => {
  const now = at("2026-10-29T17:05");
  assert.equal(isGridSlot(at("2026-10-30T12:00"), now), false);
  assert.equal(isGridSlot(at("2026-10-30T12:30"), now), false);
  assert.equal(isGridSlot(at("2026-10-30T22:00"), now), false);
  assert.equal(isGridSlot(at("2026-10-30T07:30"), now), false);
  assert.equal(isGridSlot(at("2026-10-30T09:15"), now), false);
  assert.equal(isGridSlot(at("2026-11-01T10:00"), now), false);
  assert.equal(isGridSlot(at("2026-10-29T17:30"), now), false);
  assert.equal(isGridSlot(at("2026-10-29T16:00"), now), false);
  assert.equal(isGridSlot(at("2026-10-29T17:30"), at("2026-10-29T17:01")), false);
  assert.equal(isGridSlot(new Date("invalid"), now), false);
});
