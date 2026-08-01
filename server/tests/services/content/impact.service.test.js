const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const impactRepo = require("../../../src/data/impact.repo");
const { getCurrentImpact } = require("../../../src/services/content/impact.service");

const row = {
  id: "11111111-1111-1111-1111-111111111111",
  label: "2024–25",
  period_start: "2024-07-01",
  period_end: "2025-06-30",
  families_served: 490,
  total_sessions: 6859,
  activity_types: 84,
  sessions_sports: 2792,
  sessions_fitness: 1504,
  sessions_nutrition: 1489,
  sessions_family_support: 930,
  yoy_growth_pct: "30.00",
  programme_spend_pct: "86.00",
  narrative_en: "English narrative",
  narrative_zh: "中文敘述",
  is_current: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const stubCurrent = (value) => mock.method(impactRepo, "findCurrent", async () => value);

test("nests the four flat session columns into by_programme", async (t) => {
  stubCurrent(row);
  t.after(() => mock.restoreAll());

  const impact = await getCurrentImpact("en");

  assert.deepEqual(impact.by_programme, {
    sports: 2792,
    fitness: 1504,
    nutrition: 1489,
    family_support: 930,
  });
  // The flat columns must not also survive, or the frontend has two sources of truth.
  assert.equal(impact.sessions_sports, undefined);
});

test("coerces numeric columns PostgREST may serialise as strings", async (t) => {
  stubCurrent(row);
  t.after(() => mock.restoreAll());

  const impact = await getCurrentImpact("en");

  assert.equal(impact.yoy_growth_pct, 30);
  assert.equal(impact.programme_spend_pct, 86);
});

test("does not leak storage bookkeeping to the client", async (t) => {
  stubCurrent(row);
  t.after(() => mock.restoreAll());

  const impact = await getCurrentImpact("en");

  for (const key of ["id", "is_current", "created_at", "updated_at", "narrative_en", "narrative_zh"]) {
    assert.equal(impact[key], undefined, `${key} should not be in the response`);
  }
});

test("resolves the narrative for the requested locale", async (t) => {
  stubCurrent(row);
  t.after(() => mock.restoreAll());

  assert.equal((await getCurrentImpact("zh-Hant")).narrative, "中文敘述");
  assert.equal((await getCurrentImpact("en")).narrative, "English narrative");
});

test("falls back to English when the translation is empty", async (t) => {
  stubCurrent({ ...row, narrative_zh: "" });
  t.after(() => mock.restoreAll());

  assert.equal((await getCurrentImpact("zh-Hant")).narrative, "English narrative");
});

test("throws 404 when no period is flagged current", async (t) => {
  stubCurrent(null);
  t.after(() => mock.restoreAll());

  await assert.rejects(() => getCurrentImpact("en"), (error) => {
    assert.equal(error.status, 404);
    return true;
  });
});
