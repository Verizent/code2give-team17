const test = require("node:test");
const assert = require("node:assert/strict");

const { resolveLocale } = require("../../src/lib/locale");

const article = Object.freeze({
  id: "a1",
  slug: "so-much-ability",
  title_en: "So much ability",
  title_zh: "無限可能",
  excerpt_en: "An English excerpt.",
  excerpt_zh: "中文摘要。",
});

test("resolves zh-Hant fields when the translation exists", () => {
  const resolved = resolveLocale(article, ["title", "excerpt"], "zh-Hant");

  assert.equal(resolved.title, "無限可能");
  assert.equal(resolved.excerpt, "中文摘要。");
});

test("resolves en fields when the locale is en", () => {
  const resolved = resolveLocale(article, ["title", "excerpt"], "en");

  assert.equal(resolved.title, "So much ability");
  assert.equal(resolved.excerpt, "An English excerpt.");
});

test("falls back to en when the zh value is null", () => {
  const untranslated = { ...article, title_zh: null };

  const resolved = resolveLocale(untranslated, ["title"], "zh-Hant");

  assert.equal(resolved.title, "So much ability");
});

test("falls back to en when the zh value is an empty string", () => {
  const untranslated = { ...article, title_zh: "" };

  const resolved = resolveLocale(untranslated, ["title"], "zh-Hant");

  assert.equal(resolved.title, "So much ability");
});

test("strips every _en and _zh key from the result", () => {
  const resolved = resolveLocale(article, ["title", "excerpt"], "zh-Hant");

  assert.deepEqual(Object.keys(resolved).sort(), ["excerpt", "id", "slug", "title"]);
});

test("preserves keys that are not part of the resolved field list", () => {
  const resolved = resolveLocale(article, ["title", "excerpt"], "en");

  assert.equal(resolved.id, "a1");
  assert.equal(resolved.slug, "so-much-ability");
});

test("does not mutate the row it was given", () => {
  const row = {
    id: "a1",
    title_en: "So much ability",
    title_zh: "無限可能",
  };
  const before = { ...row };

  resolveLocale(row, ["title"], "zh-Hant");

  assert.deepEqual(row, before);
});
