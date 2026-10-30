import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limit da lp-09 (Upstash Redis, janela fixa de 5 min). Fail-open: com o
// Redis fora do ar ou sem env, o envio passa e só loga — perder lead é pior que
// aceitar um duplicado. As chaves guardam só o SHA-256, nunca o dado em claro.

export type Limiter = { limit(key: string): Promise<{ success: boolean; reset: number }> };
export type LimiterName = "email" | "telefone" | "ip" | "agendamentoIp";
export type Limiters = Record<LimiterName, Limiter>;

const WINDOW = "5 m";
const LIMITS: Record<LimiterName, number> = {
  email: 1,
  telefone: 1,
  // IP compartilhado (escritório, 4G) não pode travar pessoas diferentes.
  ip: 3,
  agendamentoIp: 10,
};
const KEY_PREFIX: Record<LimiterName, string> = {
  email: "lp09:email:",
  telefone: "lp09:telefone:",
  ip: "lp09:ip:",
  agendamentoIp: "lp09:agendamento-ip:",
};

let cached: Limiters | null | undefined;

function defaultLimiters(): Limiters | null {
  if (cached !== undefined) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.error("[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN não definidas; sem rate limit");
    cached = null;
    return cached;
  }
  const redis = new Redis({ url, token });
  const make = (name: LimiterName) =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(LIMITS[name], WINDOW),
      prefix: "ratelimit",
      // Redis lento não pode segurar o envio do form; no timeout a lib deixa passar.
      timeout: 1500,
    });
  cached = {
    email: make("email"),
    telefone: make("telefone"),
    ip: make("ip"),
    agendamentoIp: make("agendamentoIp"),
  };
  return cached;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// O form já manda E.164 ("+5511999999999"); aqui só garante "+" e dígitos.
export function normalizeTelefone(telefone: string) {
  return `+${telefone.replace(/\D/g, "")}`;
}

function key(name: LimiterName, value: string) {
  return `${KEY_PREFIX[name]}${createHash("sha256").update(value).digest("hex")}`;
}

export type RateLimitResult = { ok: true } | { ok: false; by: LimiterName; retryAfterMinutes: number };

async function check(
  checks: [LimiterName, string | null][],
  limiters: Limiters | null,
  now: number
): Promise<RateLimitResult> {
  if (!limiters) return { ok: true };
  // Em sequência e parando no primeiro bloqueio: um e-mail repetido não gasta a cota do IP.
  for (const [name, value] of checks) {
    if (!value) continue;
    try {
      const { success, reset } = await limiters[name].limit(key(name, value));
      if (!success) {
        return { ok: false, by: name, retryAfterMinutes: Math.max(1, Math.ceil((reset - now) / 60000)) };
      }
    } catch (err) {
      console.error(`[rate-limit] Redis indisponível (${name}); deixando passar:`, err);
      return { ok: true };
    }
  }
  return { ok: true };
}

export function checkLeadRateLimit(
  input: { email: string; telefone: string; ip: string | null },
  limiters: Limiters | null = defaultLimiters(),
  now = Date.now()
) {
  return check(
    [
      ["email", normalizeEmail(input.email)],
      ["telefone", normalizeTelefone(input.telefone)],
      ["ip", input.ip],
    ],
    limiters,
    now
  );
}

export function checkAgendamentoRateLimit(
  ip: string | null,
  limiters: Limiters | null = defaultLimiters(),
  now = Date.now()
) {
  return check([["agendamentoIp", ip]], limiters, now);
}

export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || null;
}
