import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getMetaCapiToken, META_PIXEL_ID, pixelIdForVariant } from "@/lib/meta-pixels";
import { sendLeadToMetaCapi } from "@/lib/meta-capi";

const LP10_PIXEL = "2273129966864397";
const ENV_KEYS = ["META_CAPI_TOKEN", `META_CAPI_TOKEN_${LP10_PIXEL}`, `META_CAPI_TOKEN_${META_PIXEL_ID}`];
const originalFetch = globalThis.fetch;

afterEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
  globalThis.fetch = originalFetch;
});

test("mapa variante → pixel", () => {
  assert.equal(META_PIXEL_ID, "348950488264714");
  assert.equal(pixelIdForVariant("lp-10"), LP10_PIXEL);
  for (const v of ["lp-01", "lp-05", "lp-09", "lp-99", "", null, undefined]) {
    assert.equal(pixelIdForVariant(v), META_PIXEL_ID, String(v));
  }
});

test("pixel padrão continua aceitando META_CAPI_TOKEN", () => {
  process.env.META_CAPI_TOKEN = "EAAgenerico";
  assert.equal(getMetaCapiToken()?.info.source, "META_CAPI_TOKEN");
});

test("lp-10 sem token próprio não cai no META_CAPI_TOKEN", () => {
  process.env.META_CAPI_TOKEN = "EAAgenerico";
  assert.equal(getMetaCapiToken(LP10_PIXEL), undefined);
  process.env[`META_CAPI_TOKEN_${LP10_PIXEL}`] = "EAAlp10";
  assert.equal(getMetaCapiToken(LP10_PIXEL)?.token, "EAAlp10");
});

const lead = (variant: string) => ({
  eventId: "evt-1",
  email: "a@b.com",
  phone: "11999999999",
  name: "Fulano Teste",
  ip: null,
  userAgent: null,
  variant,
});

function captureFetch() {
  const urls: string[] = [];
  globalThis.fetch = (async (url: string | URL | Request) => {
    urls.push(String(url));
    return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
  }) as typeof fetch;
  return urls;
}

test("CAPI usa o pixel da variante do lead", async () => {
  process.env.META_CAPI_TOKEN = "EAAgenerico";
  process.env[`META_CAPI_TOKEN_${LP10_PIXEL}`] = "EAAlp10";
  const urls = captureFetch();

  await sendLeadToMetaCapi(lead("lp-10"));
  await sendLeadToMetaCapi(lead("lp-09"));

  assert.match(urls[0], new RegExp(`/${LP10_PIXEL}/events\\?access_token=EAAlp10$`));
  assert.match(urls[1], new RegExp(`/${META_PIXEL_ID}/events\\?access_token=EAAgenerico$`));
});

test("CAPI da lp-10 sem token próprio não envia", async () => {
  process.env.META_CAPI_TOKEN = "EAAgenerico";
  const urls = captureFetch();
  const result = await sendLeadToMetaCapi(lead("lp-10"));
  assert.equal(result.status, "no_token");
  assert.equal(urls.length, 0);
});
