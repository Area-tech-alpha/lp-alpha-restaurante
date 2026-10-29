import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/agendamento/followup/route";
import { buildComercialPayload } from "@/lib/agendamento-followup";
import type { LeadAgendamento } from "@/lib/agendamento-token";

process.env.QSTASH_CURRENT_SIGNING_KEY = "sig_current_teste";
process.env.QSTASH_NEXT_SIGNING_KEY = "sig_next_teste";

const request = (headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/agendamento/followup", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ token: "x" }),
  });

test("followup sem assinatura → 401", async () => {
  assert.equal((await POST(request())).status, 401);
});

test("followup com assinatura inválida → 401", async () => {
  assert.equal((await POST(request({ "upstash-signature": "a.b.c" }))).status, 401);
});

test("payload do comercial = payload do CRM_WEBHOOK_URL + crm_lead_id + motivo", () => {
  const lead: LeadAgendamento = {
    leadKey: "lead-1",
    crmLeadId: "crm-9",
    nome: "Ana",
    email: "ana@ex.com",
    telefone: "+5511999999999",
    empresa: "Cantina",
    segmento: "Restaurante",
    faturamento: "Acima de 100 mil",
    cnpj: null,
    investiria: null,
    variante: "lp-09",
    utm_source: "meta",
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    referrer: null,
    fbclid: null,
    fbc: null,
    fbp: "fb.1.1.1",
  };
  const payload = buildComercialPayload(lead);
  assert.equal(payload.lead_id, "lead-1");
  assert.equal(payload.origem, "alpha-restaurante");
  assert.equal(payload.variante, "lp-09");
  assert.equal(payload.crm_lead_id, "crm-9");
  assert.equal(payload.motivo, "nao_agendou_5min");
  assert.deepEqual(Object.keys(payload).sort(), [
    "cnpj", "crm_lead_id", "email", "empresa", "faturamento", "fbc", "fbclid", "fbp",
    "investiria", "lead_id", "motivo", "nome", "origem", "referrer", "segmento", "telefone",
    "utm_campaign", "utm_content", "utm_medium", "utm_source", "utm_term", "variante",
  ]);
});
