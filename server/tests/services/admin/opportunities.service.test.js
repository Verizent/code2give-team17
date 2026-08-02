const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const opportunitiesRepo = require("../../../src/data/volunteer-opportunities.repo");
const adminOpportunitiesService = require("../../../src/services/admin/opportunities.service");

const rawRow = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  title_en: "Weekend Class Assistant",
  title_zh: "周末課堂助理",
  description_en: "Help with weekend class.",
  description_zh: "協助周末課堂。",
  location_en: "Kwun Tong",
  location_zh: "觀塘",
  programme: "sports",
  starts_at: "2026-09-06T02:00:00.000Z",
  ends_at: "2026-09-06T05:00:00.000Z",
  capacity: 8,
  spots_filled_handson: 0,
  min_age: 16,
  skills: ["mandarin"],
  status: "open",
  source: "internal",
  handson_url: null,
  handson_opportunity_id: null,
  last_synced_at: null,
};

test("createOpportunity forwards the strict-object body to the repo insert and returns raw bilingual fields", async (t) => {
  const createOpportunity = mock.fn(async (data) => ({ ...rawRow, ...data }));
  mock.method(opportunitiesRepo, "createOpportunity", createOpportunity);
  t.after(() => mock.restoreAll());

  const body = {
    title_en: "Weekend Class Assistant",
    title_zh: "周末課堂助理",
    description_en: "Help with weekend class.",
    description_zh: "協助周末課堂。",
    location_en: "Kwun Tong",
    location_zh: "觀塘",
    programme: "sports",
    starts_at: "2026-09-06T02:00:00.000Z",
    ends_at: "2026-09-06T05:00:00.000Z",
    capacity: 8,
    min_age: 16,
    skills: ["mandarin"],
    source: "internal",
  };

  const result = await adminOpportunitiesService.createOpportunity(body);

  assert.equal(createOpportunity.mock.calls.length, 1);
  const call = createOpportunity.mock.calls[0].arguments[0];
  assert.equal(call.title_en, "Weekend Class Assistant");
  assert.equal(call.title_zh, "周末課堂助理");
  assert.equal(call.programme, "sports");
  // Admin returns raw _en/_zh pair — admin UI edits both languages.
  assert.equal(result.title_en, "Weekend Class Assistant");
  assert.equal(result.title_zh, "周末課堂助理");
});

test("updateOpportunity throws 404 when the id does not exist", async (t) => {
  mock.method(opportunitiesRepo, "findOpportunityById", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => adminOpportunitiesService.updateOpportunity(rawRow.id, { capacity: 12 }),
    (error) => {
      assert.equal(error.status, 404);
      return true;
    },
  );
});

test("updateOpportunity patches only the provided fields and returns the updated row", async (t) => {
  mock.method(opportunitiesRepo, "findOpportunityById", async () => rawRow);
  const updateOpportunity = mock.fn(async (id, patch) => ({ ...rawRow, ...patch }));
  mock.method(opportunitiesRepo, "updateOpportunity", updateOpportunity);
  t.after(() => mock.restoreAll());

  const result = await adminOpportunitiesService.updateOpportunity(rawRow.id, { capacity: 12 });

  const call = updateOpportunity.mock.calls[0];
  assert.equal(call.arguments[0], rawRow.id);
  assert.deepEqual(call.arguments[1], { capacity: 12 });
  assert.equal(result.capacity, 12);
  // Untouched bilingual fields still present.
  assert.equal(result.title_en, rawRow.title_en);
  assert.equal(result.title_zh, rawRow.title_zh);
});

test("removeOpportunity throws 404 when the id does not exist", async (t) => {
  mock.method(opportunitiesRepo, "findOpportunityById", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => adminOpportunitiesService.removeOpportunity(rawRow.id),
    (error) => {
      assert.equal(error.status, 404);
      return true;
    },
  );
});

test("removeOpportunity calls the repo delete when the row exists", async (t) => {
  mock.method(opportunitiesRepo, "findOpportunityById", async () => rawRow);
  const deleteOpportunity = mock.fn(async () => undefined);
  mock.method(opportunitiesRepo, "deleteOpportunity", deleteOpportunity);
  t.after(() => mock.restoreAll());

  await adminOpportunitiesService.removeOpportunity(rawRow.id);

  assert.equal(deleteOpportunity.mock.calls.length, 1);
  assert.equal(deleteOpportunity.mock.calls[0].arguments[0], rawRow.id);
});

test("listForAdmin returns raw bilingual rows and paging meta across every status", async (t) => {
  const listForAdmin = mock.fn(async () => ({
    rows: [rawRow, { ...rawRow, id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", status: "draft" }],
    total: 2,
  }));
  mock.method(opportunitiesRepo, "listForAdmin", listForAdmin);
  t.after(() => mock.restoreAll());

  const { items, meta } = await adminOpportunitiesService.listForAdmin({ page: 1, limit: 25 });

  assert.equal(items.length, 2);
  // Raw _en/_zh preserved — admin UI edits both.
  assert.equal(items[0].title_en, rawRow.title_en);
  assert.equal(items[0].title_zh, rawRow.title_zh);
  // Includes draft (unpublished) status — this is the admin variant, not the public list.
  assert.equal(items[1].status, "draft");
  assert.deepEqual(meta, { total: 2, page: 1, limit: 25 });
});
