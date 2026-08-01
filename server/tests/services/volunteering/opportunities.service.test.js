const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const opportunitiesRepo = require("../../../src/data/opportunities.repo");
const interestsRepo = require("../../../src/data/interests.repo");
const {
  listOpportunities,
  getOpportunityById,
} = require("../../../src/services/volunteering/opportunities.service");

const listRow = {
  id: "a1111111-1111-4111-8111-111111111111",
  title_en: "K-pop Dance Class Assistant",
  title_zh: "K-pop 舞蹈班助理",
  description_en: "Dance along.",
  description_zh: null,
  location_en: "Address after signup",
  location_zh: "報名後提供地址",
  programme: "sports",
  starts_at: "2026-08-15T02:00:00.000Z",
  ends_at: "2026-08-15T03:30:00.000Z",
  capacity: 1,
  spots_filled: 0,
  min_age: 16,
  skills: ["patient", "music"],
  status: "open",
  source: "handson",
  handson_url: "https://volunteer.handsonhongkong.org/opportunity/a0CQ90000DFXgKwMQL",
  handson_opportunity_id: "a0CQ90000DFXgKwMQL",
  last_synced_at: "2026-08-01T00:00:00.000Z",
};

test("listOpportunities maps rows and keeps bilingual fields", async (t) => {
  mock.method(opportunitiesRepo, "listOpen", async () => ({ rows: [listRow], total: 1 }));
  mock.method(interestsRepo, "countByOpportunityIds", async () => new Map([[listRow.id, 2]]));
  t.after(() => mock.restoreAll());

  const { items, meta } = await listOpportunities({ page: 1, limit: 12 });

  assert.equal(items[0].title_en, "K-pop Dance Class Assistant");
  assert.equal(items[0].title_zh, "K-pop 舞蹈班助理");
  assert.equal(items[0].starts_at, listRow.starts_at);
  assert.equal(items[0].interested_count, 2);
  assert.deepEqual(meta, { total: 1, page: 1, limit: 12 });
});

test("listOpportunities forwards programme and source filters", async (t) => {
  const listOpen = mock.fn(async () => ({ rows: [], total: 0 }));
  mock.method(opportunitiesRepo, "listOpen", listOpen);
  mock.method(interestsRepo, "countByOpportunityIds", async () => new Map());
  t.after(() => mock.restoreAll());

  await listOpportunities({ programme: "nutrition", source: "internal", page: 1, limit: 12 });

  const call = listOpen.mock.calls[0].arguments[0];
  assert.equal(call.programme, "nutrition");
  assert.equal(call.source, "internal");
});

test("getOpportunityById 404s when missing", async (t) => {
  mock.method(opportunitiesRepo, "findOpenById", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(() => getOpportunityById(listRow.id), (error) => {
    assert.equal(error.status, 404);
    return true;
  });
});
