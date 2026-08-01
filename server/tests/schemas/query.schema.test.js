const test = require("node:test");
const assert = require("node:assert/strict");

const { listQuerySchema } = require("../../src/schemas/query.schema");

test("defaults page, limit and locale when the query is empty", () => {
  const parsed = listQuerySchema.parse({});

  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 12);
  assert.equal(parsed.locale, "en");
});

test("coerces the numeric strings a query string actually delivers", () => {
  const parsed = listQuerySchema.parse({ page: "2", limit: "24" });

  assert.equal(parsed.page, 2);
  assert.equal(parsed.limit, 24);
});

// Link sharing and client libraries append params we never declared. A 400 for an
// unknown query key is a baffling failure for whoever is building the frontend, so
// query schemas strip — unlike bodies, which are strict.
test("strips an unknown query parameter instead of rejecting the request", () => {
  const result = listQuerySchema.safeParse({ page: "1", utm_source: "newsletter" });

  assert.equal(result.success, true);
  assert.equal(result.data.utm_source, undefined);
});

test("accepts both supported locales and rejects anything else", () => {
  assert.equal(listQuerySchema.safeParse({ locale: "en" }).success, true);
  assert.equal(listQuerySchema.safeParse({ locale: "zh-Hant" }).success, true);
  assert.equal(listQuerySchema.safeParse({ locale: "fr" }).success, false);
});

test("rejects a non-numeric page rather than silently defaulting", () => {
  assert.equal(listQuerySchema.safeParse({ page: "abc" }).success, false);
});

// Asymmetric on purpose. A shared link carrying ?limit=100 was clicked, not typed, so
// the visitor cannot act on a 400 — they get 50 rows and meta.limit says so. A limit of
// 0 asks for nothing, which is a real bug and worth surfacing.
test("clamps a limit above 50 rather than rejecting it", () => {
  assert.equal(listQuerySchema.parse({ limit: "51" }).limit, 50);
  assert.equal(listQuerySchema.parse({ limit: "10000" }).limit, 50);
  assert.equal(listQuerySchema.parse({ limit: "50" }).limit, 50);
  assert.equal(listQuerySchema.parse({ limit: "24" }).limit, 24);
});

test("rejects a limit below 1 instead of clamping it", () => {
  assert.equal(listQuerySchema.safeParse({ limit: "0" }).success, false);
  assert.equal(listQuerySchema.safeParse({ limit: "-5" }).success, false);
});
