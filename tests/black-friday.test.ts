import { test } from "node:test";
import assert from "node:assert/strict";
import { hasAgendamento, variantFromUrl, variants } from "@/lib/variants";
import { pixelIdForVariant, META_PIXEL_ID } from "@/lib/meta-pixels";
import { content } from "@/lib/content";

test("lp-11: origem lp-11, sem agendamento, pixel padrão", () => {
  assert.equal(variantFromUrl("https://assessorialpha.com/lp-11?utm_source=meta"), "lp-11");
  assert.equal(hasAgendamento("lp-11"), false);
  assert.equal(pixelIdForVariant("lp-11"), META_PIXEL_ID);
});

test("lp-11: cronômetro com prazo fixo em 27/11 23:59:59 de Brasília", () => {
  const { countdown } = variants["lp-11"];
  assert.equal(countdown.endsAt, "2026-11-27T23:59:59-03:00");
  assert.equal(Date.parse(countdown.endsAt), Date.UTC(2026, 10, 28, 2, 59, 59));
});

test("lp-11: sem depoimentos inventados", () => {
  assert.equal(content.blackFriday.depoimentos.items.length, 0);
});
