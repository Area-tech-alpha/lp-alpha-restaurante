import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkAgendamentoRateLimit,
  checkLeadRateLimit,
  type Limiter,
  type Limiters,
} from "@/lib/rate-limit";
import { getAgendaOrganizer } from "@/lib/google-calendar";

const WINDOW_MS = 5 * 60_000;

// Janela fixa em memória, no lugar do Upstash. Guarda as chaves para checar o hash.
function memoryLimiters(clock: { now: number }) {
  const seen: string[] = [];
  const make = (max: number): Limiter => {
    const windows = new Map<string, { count: number; reset: number }>();
    return {
      async limit(key) {
        seen.push(key);
        const w = windows.get(key);
        if (!w || clock.now >= w.reset) {
          windows.set(key, { count: 1, reset: clock.now + WINDOW_MS });
          return { success: true, reset: clock.now + WINDOW_MS };
        }
        w.count++;
        return { success: w.count <= max, reset: w.reset };
      },
    };
  };
  const limiters: Limiters = { email: make(1), telefone: make(1), ip: make(3), agendamentoIp: make(10) };
  return { limiters, seen };
}

const lead = (email: string, telefone: string, ip = "200.1.1.1") => ({ email, telefone, ip });

test("mesmo e-mail 2x em < 5 min → bloqueia, com minutos até liberar", async () => {
  const clock = { now: 0 };
  const { limiters } = memoryLimiters(clock);
  assert.deepEqual(await checkLeadRateLimit(lead("ana@ex.com", "+5511911110001"), limiters, clock.now), { ok: true });
  clock.now = 60_000;
  // Normaliza: espaços e maiúsculas contam como o mesmo e-mail.
  assert.deepEqual(await checkLeadRateLimit(lead("  ANA@ex.com ", "+5511911110002"), limiters, clock.now), {
    ok: false,
    by: "email",
    retryAfterMinutes: 4,
  });
});

test("depois de 5 min o mesmo e-mail passa de novo", async () => {
  const clock = { now: 0 };
  const { limiters } = memoryLimiters(clock);
  await checkLeadRateLimit(lead("ana@ex.com", "+5511911110001"), limiters, clock.now);
  clock.now = WINDOW_MS;
  assert.equal((await checkLeadRateLimit(lead("ana@ex.com", "+5511911110001"), limiters, clock.now)).ok, true);
});

test("mesmo telefone com e-mail diferente → bloqueia", async () => {
  const clock = { now: 0 };
  const { limiters } = memoryLimiters(clock);
  await checkLeadRateLimit(lead("ana@ex.com", "+5511911110001"), limiters, clock.now);
  const res = await checkLeadRateLimit(lead("bia@ex.com", "+55 (11) 91111-0001"), limiters, clock.now);
  assert.equal(res.ok, false);
  assert.equal(res.ok === false && res.by, "telefone");
});

test("e-mails/telefones diferentes no mesmo IP → até 3 passam, o 4º bloqueia", async () => {
  const clock = { now: 0 };
  const { limiters } = memoryLimiters(clock);
  const results = [];
  for (let i = 1; i <= 4; i++) {
    results.push(await checkLeadRateLimit(lead(`p${i}@ex.com`, `+551191111000${i}`), limiters, clock.now));
  }
  assert.deepEqual(
    results.map((r) => r.ok),
    [true, true, true, false]
  );
  assert.equal(results[3].ok === false && results[3].by, "ip");
});

test("Redis indisponível → passa (fail-open)", async () => {
  const broken: Limiter = {
    limit: async () => {
      throw new Error("ECONNREFUSED");
    },
  };
  const limiters: Limiters = { email: broken, telefone: broken, ip: broken, agendamentoIp: broken };
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(await checkLeadRateLimit(lead("ana@ex.com", "+5511911110001"), limiters), { ok: true });
    assert.deepEqual(await checkAgendamentoRateLimit("200.1.1.1", limiters), { ok: true });
  } finally {
    console.error = originalError;
  }
});

test("sem env do Redis (limiters null) → passa", async () => {
  assert.deepEqual(await checkLeadRateLimit(lead("ana@ex.com", "+5511911110001"), null), { ok: true });
});

test("chaves guardam só SHA-256 com prefixo, nunca o dado em claro", async () => {
  const clock = { now: 0 };
  const { limiters, seen } = memoryLimiters(clock);
  await checkLeadRateLimit(lead("ana@ex.com", "+5511911110001"), limiters, clock.now);
  assert.equal(seen.length, 3);
  assert.match(seen[0], /^lp09:email:[0-9a-f]{64}$/);
  assert.match(seen[1], /^lp09:telefone:[0-9a-f]{64}$/);
  assert.match(seen[2], /^lp09:ip:[0-9a-f]{64}$/);
  assert.ok(seen.every((k) => !k.includes("ana") && !k.includes("5511") && !k.includes("200.1")));
});

test("POST /api/agendamento: 10 por IP a cada 5 min", async () => {
  const clock = { now: 0 };
  const { limiters } = memoryLimiters(clock);
  const results = [];
  for (let i = 0; i < 11; i++) results.push((await checkAgendamentoRateLimit("200.1.1.1", limiters, clock.now)).ok);
  assert.deepEqual(results, [...Array(10).fill(true), false]);
});

test("organizer: sem AGENDA_ORGANIZER_EMAIL o closer organiza; com ela o closer vira convidado", () => {
  process.env.CLOSER_CALENDAR_EMAIL = "closer@ex.com";
  delete process.env.AGENDA_ORGANIZER_EMAIL;
  assert.deepEqual(getAgendaOrganizer(), { organizerEmail: "closer@ex.com", hostEmail: null });
  process.env.AGENDA_ORGANIZER_EMAIL = "agenda@ex.com";
  assert.deepEqual(getAgendaOrganizer(), { organizerEmail: "agenda@ex.com", hostEmail: "closer@ex.com" });
});
