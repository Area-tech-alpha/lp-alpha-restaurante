import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { resolveAgendaSdr } from "@/lib/sdr-queue";
import { buildAgendamentoWebhookPayload } from "@/lib/agendamento-webhook";
import { buildCrmLeadPayload } from "@/lib/crm";
import type { LeadAgendamento } from "@/lib/agendamento-token";

// Sem rede: o fetch do Dashcom é trocado por um stub em cada teste.
const realFetch = globalThis.fetch;
process.env.CRM_API_URL = "https://dashcom.test/";
process.env.LP_TRACKING_API_KEY = "k";
process.env.CLOSER_CALENDAR_EMAIL = "fixo@ex.com";
process.env.CLOSER_INITIAL = "Y";
process.env.CLOSER_NAME = "Yoshio";

const calls: { url: string; init?: RequestInit }[] = [];
function stubFetch(handler: () => Response | Promise<Response>) {
  calls.length = 0;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return handler();
  }) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

const lead = { leadKey: "lead-1", empresa: "Mestre do Frango" };

test("fila: usa o SDR que o Dashcom devolve e manda leadKey/empresa", async () => {
  stubFetch(() =>
    Response.json({
      assignment: {
        assignmentId: "a1",
        leadKey: "lead-1",
        sdrUserId: "u1",
        sdrName: "Ana SDR",
        sdrEmail: "ana@ex.com",
        titleInitial: "A",
        status: "RESERVED",
        reused: false,
      },
    })
  );
  const sdr = await resolveAgendaSdr(lead);
  assert.deepEqual(sdr, { email: "ana@ex.com", name: "Ana SDR", initial: "A", fromQueue: true });
  assert.equal(calls[0].url, "https://dashcom.test/external/lp/sdr-queue/assign");
  assert.equal(calls[0].init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
    leadKey: "lead-1",
    empresa: "Mestre do Frango",
    site: "alpha-restaurante",
  });
});

test("fila vazia: cai na agenda fixa (CLOSER_*)", async () => {
  stubFetch(() => Response.json({ assignment: null }));
  assert.deepEqual(await resolveAgendaSdr(lead), {
    email: "fixo@ex.com",
    name: "Yoshio",
    initial: "Y",
    fromQueue: false,
  });
});

test("Dashcom fora do ar: cai na agenda fixa sem derrubar o agendamento", async () => {
  stubFetch(() => new Response("boom", { status: 500 }));
  assert.equal((await resolveAgendaSdr(lead)).email, "fixo@ex.com");
  stubFetch(() => {
    throw new TypeError("fetch failed");
  });
  assert.equal((await resolveAgendaSdr(lead)).email, "fixo@ex.com");
});

test("webhook do agendamento leva nome e e-mail do SDR", () => {
  const payload = buildAgendamentoWebhookPayload(
    "crm-1",
    "Mestre do Frango",
    "De 100 a 200 mil",
    new Date("2026-11-10T17:00:00Z"),
    { name: "Ana SDR", email: "ana@ex.com" }
  );
  assert.equal(payload.sdr_nome, "Ana SDR");
  assert.equal(payload.sdr_email, "ana@ex.com");
  assert.equal(payload.data_hora_reuniao, "2026-11-10T14:00:00-03:00");
});

test("CRM: envio do form vai sem sdr_email; o do agendamento vai com o SDR", () => {
  const l = { leadKey: "lead-1", faturamento: "De 100 a 200 mil", investiria: null } as unknown as LeadAgendamento;
  assert.equal("sdr_email" in buildCrmLeadPayload(l, null), false);
  assert.equal(buildCrmLeadPayload(l, "ana@ex.com").sdr_email, "ana@ex.com");
});
