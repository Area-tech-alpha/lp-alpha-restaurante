import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { bookOnAvailableAgenda, findLeadEventInAgendas, type AgendaSdr } from "@/lib/sdr-queue";
import { EventAlreadyExistsError, GoogleCalendarAccountError, GoogleCalendarError } from "@/lib/google-calendar";
import { buildCrmLeadPayload } from "@/lib/crm";
import type { LeadAgendamento } from "@/lib/agendamento-token";

// Sem rede: o fetch do Dashcom é trocado por um stub em cada teste, e a agenda do Google pelo
// `book` passado ao bookOnAvailableAgenda.
const realFetch = globalThis.fetch;
process.env.CRM_API_URL = "https://dashcom.test/";
process.env.LP_TRACKING_API_KEY = "k";
process.env.CLOSER_CALENDAR_EMAIL = "fixo@ex.com";
process.env.CLOSER_NAME = "Yoshio";

const calls: { url: string; init?: RequestInit }[] = [];
function stubFetch(handler: (n: number) => Response | Promise<Response>) {
  calls.length = 0;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return handler(calls.length);
  }) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = realFetch;
  process.env.CLOSER_CALENDAR_EMAIL = "fixo@ex.com";
});

const lead = { leadKey: "lead-1", empresa: "Mestre do Frango" };

function assignment(sdrEmail: string, sdrName: string) {
  return Response.json({
    assignment: { assignmentId: "a1", leadKey: "lead-1", sdrUserId: "u", sdrName, sdrEmail, status: "RESERVED", reused: false },
  });
}

const body = (i: number) => JSON.parse(String(calls[i].init?.body));
const ok = async (sdr: AgendaSdr) => `evento-${sdr.email}`;

test("fila: usa o SDR que o Dashcom devolve e manda leadKey/empresa", async () => {
  stubFetch(() => assignment("ana@ex.com", "Ana SDR"));
  const { sdr, result } = await bookOnAvailableAgenda(lead, ok);
  assert.deepEqual(sdr, { email: "ana@ex.com", name: "Ana SDR", fromQueue: true });
  assert.equal(result, "evento-ana@ex.com");
  assert.equal(calls[0].url, "https://dashcom.test/external/lp/sdr-queue/assign");
  assert.equal(calls[0].init?.method, "POST");
  assert.deepEqual(body(0), { leadKey: "lead-1", empresa: "Mestre do Frango", site: "alpha-restaurante" });
});

test("fila vazia: cai na agenda fixa (CLOSER_*)", async () => {
  stubFetch(() => Response.json({ assignment: null }));
  const { sdr } = await bookOnAvailableAgenda(lead, ok);
  assert.deepEqual(sdr, { email: "fixo@ex.com", name: "Yoshio", fromQueue: false });
});

test("Dashcom fora do ar: cai na agenda fixa sem derrubar o agendamento", async () => {
  stubFetch(() => new Response("boom", { status: 500 }));
  assert.equal((await bookOnAvailableAgenda(lead, ok)).sdr.email, "fixo@ex.com");
  stubFetch(() => {
    throw new TypeError("fetch failed");
  });
  assert.equal((await bookOnAvailableAgenda(lead, ok)).sdr.email, "fixo@ex.com");
});

test("conta do SDR apagada no Workspace: troca de SDR e pede ao Dashcom para pausar", async () => {
  stubFetch((n) => (n === 1 ? assignment("ana@ex.com", "Ana SDR") : assignment("bia@ex.com", "Bia SDR")));
  const tried: string[] = [];
  const { sdr } = await bookOnAvailableAgenda(lead, async (s) => {
    tried.push(s.email);
    if (s.email === "ana@ex.com") throw new GoogleCalendarAccountError(s.email, new Error("invalid_grant: Invalid email or User ID"));
    return "ok";
  });
  assert.equal(sdr.email, "bia@ex.com");
  assert.deepEqual(tried, ["ana@ex.com", "bia@ex.com"]);
  assert.deepEqual(body(1).excludeSdrEmails, ["ana@ex.com"]);
  assert.equal(body(1).unavailableReason, "calendar_account_invalid");
});

test("erro comum do Google no SDR: troca de SDR sem pedir pausa", async () => {
  stubFetch((n) => (n === 1 ? assignment("ana@ex.com", "Ana SDR") : assignment("bia@ex.com", "Bia SDR")));
  const { sdr } = await bookOnAvailableAgenda(lead, async (s) => {
    if (s.email === "ana@ex.com") throw new GoogleCalendarError("Calendar API 500: x", 500);
    return "ok";
  });
  assert.equal(sdr.email, "bia@ex.com");
  assert.equal(body(1).unavailableReason, "calendar_error");
});

test("agenda fixa apagada e fila vazia: o agendamento falha com o erro da agenda", async () => {
  stubFetch(() => Response.json({ assignment: null }));
  const gone = new GoogleCalendarAccountError("fixo@ex.com", new Error("invalid_grant"));
  await assert.rejects(
    bookOnAvailableAgenda(lead, async () => {
      throw gone;
    }),
    (err) => err === gone
  );
});

test("sem CLOSER_CALENDAR_EMAIL: a fila funciona e nada quebra", async () => {
  delete process.env.CLOSER_CALENDAR_EMAIL;
  stubFetch(() => assignment("ana@ex.com", "Ana SDR"));
  assert.equal((await bookOnAvailableAgenda(lead, ok)).sdr.email, "ana@ex.com");
  stubFetch(() => Response.json({ assignment: null }));
  await assert.rejects(bookOnAvailableAgenda(lead, ok));
});

test("Dashcom antigo devolve o mesmo SDR recusado: cai na agenda fixa", async () => {
  stubFetch(() => assignment("ana@ex.com", "Ana SDR"));
  const { sdr } = await bookOnAvailableAgenda(lead, async (s) => {
    if (s.email === "ana@ex.com") throw new GoogleCalendarAccountError(s.email, new Error("invalid_grant"));
    return "ok";
  });
  assert.equal(sdr.email, "fixo@ex.com");
});

test("reunião já existe: não troca de agenda", async () => {
  stubFetch(() => assignment("ana@ex.com", "Ana SDR"));
  await assert.rejects(
    bookOnAvailableAgenda(lead, async () => {
      throw new EventAlreadyExistsError();
    }),
    EventAlreadyExistsError
  );
  assert.equal(calls.length, 1);
});

test("nenhuma agenda responde na checagem 'já agendou': segue sem travar", async () => {
  // Sem GOOGLE_SA_*, toda consulta ao Google falha, como uma conta apagada.
  stubFetch(() => Response.json({ assignment: { sdrEmail: "ana@ex.com" } }));
  assert.equal(await findLeadEventInAgendas("lead-1"), null);
});

test("CRM: envio do form vai sem sdr_email; o do agendamento vai com o SDR", () => {
  const l = { leadKey: "lead-1", faturamento: "De 100 a 200 mil", investiria: null } as unknown as LeadAgendamento;
  assert.equal("sdr_email" in buildCrmLeadPayload(l, null), false);
  assert.equal(buildCrmLeadPayload(l, "ana@ex.com").sdr_email, "ana@ex.com");
});
