const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const opportunitiesRepo = require("../../../src/data/volunteer-opportunities.repo");
const sessionsRepo = require("../../../src/data/sessions.repo");
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

/** The body the route hands the service, already through `createOpportunityBodySchema`. */
function validBody(overrides = {}) {
  return {
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
    ...overrides,
  };
}

test("createOpportunity forwards the strict-object body to the repo insert and returns raw bilingual fields", async (t) => {
  const createOpportunity = mock.fn(async (data) => ({ ...rawRow, ...data }));
  mock.method(opportunitiesRepo, "createOpportunity", createOpportunity);
  mock.method(sessionsRepo, "create", async (data) => ({ id: "session-1", ...data }));
  t.after(() => mock.restoreAll());

  const { opportunity } = await adminOpportunitiesService.createOpportunity(validBody());

  assert.equal(createOpportunity.mock.calls.length, 1);
  const call = createOpportunity.mock.calls[0].arguments[0];
  assert.equal(call.title_en, "Weekend Class Assistant");
  assert.equal(call.title_zh, "周末課堂助理");
  assert.equal(call.programme, "sports");
  // Admin returns raw _en/_zh pair — admin UI edits both languages.
  assert.equal(opportunity.title_en, "Weekend Class Assistant");
  assert.equal(opportunity.title_zh, "周末課堂助理");
});

test("createOpportunity also creates the sessions row and links it back to the listing", async (t) => {
  mock.method(opportunitiesRepo, "createOpportunity", async (data) => ({ ...rawRow, ...data }));
  const create = mock.fn(async (data) => ({ id: "session-1", ...data }));
  mock.method(sessionsRepo, "create", create);
  t.after(() => mock.restoreAll());

  const { session } = await adminOpportunitiesService.createOpportunity(validBody());

  assert.equal(create.mock.calls.length, 1);
  const row = create.mock.calls[0].arguments[0];
  assert.equal(row.volunteer_opportunity_id, rawRow.id);
  assert.equal(row.status, "scheduled");
  assert.equal(row.title_en, "Weekend Class Assistant");
  assert.equal(row.capacity, 8);
  // Both bilingual designs on `sessions` get the location, or one consumer renders blank.
  assert.equal(row.location, "Kwun Tong");
  assert.equal(row.location_en, "Kwun Tong");
  assert.equal(row.location_zh, "觀塘");
  assert.equal(session.volunteer_opportunity_id, rawRow.id);
});

test("createOpportunity maps the programme vocabularies the two tables disagree on", async (t) => {
  mock.method(opportunitiesRepo, "createOpportunity", async (data) => ({ ...rawRow, ...data }));
  const create = mock.fn(async (data) => ({ id: "session-1", ...data }));
  mock.method(sessionsRepo, "create", create);
  t.after(() => mock.restoreAll());

  await adminOpportunitiesService.createOpportunity(validBody({ programme: "family_support" }));
  await adminOpportunitiesService.createOpportunity(
    validBody({ programme: "community_education" }),
  );

  // `sessions` has no `family_support` or `community_education`, and no check constraint to
  // reject them — an unmapped value would insert and then match no programme filter.
  assert.equal(create.mock.calls[0].arguments[0].programme, "family");
  assert.equal(create.mock.calls[1].arguments[0].programme, "community");
});

test("createOpportunity removes the listing again when the session insert fails", async (t) => {
  mock.method(opportunitiesRepo, "createOpportunity", async (data) => ({ ...rawRow, ...data }));
  mock.method(sessionsRepo, "create", async () => {
    throw new Error("insert failed");
  });
  const deleteOpportunity = mock.fn(async () => undefined);
  mock.method(opportunitiesRepo, "deleteOpportunity", deleteOpportunity);
  t.after(() => mock.restoreAll());

  // A listing with no session is the disconnected state the link exists to prevent, so the
  // half-written pair is undone rather than kept.
  await assert.rejects(() => adminOpportunitiesService.createOpportunity(validBody()));

  assert.equal(deleteOpportunity.mock.calls.length, 1);
  assert.equal(deleteOpportunity.mock.calls[0].arguments[0], rawRow.id);
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
  mock.method(opportunitiesRepo, "countRosterByOpportunity", async () => new Map());
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

test("listForAdmin counts the roster from signups, never from the HandsOn booking column", async (t) => {
  const other = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  mock.method(opportunitiesRepo, "listForAdmin", async () => ({
    // 40 HandsOn bookings on a listing nobody signed up for here. If the count came from
    // this column the roster screen would promise 40 people and show an empty table.
    rows: [
      { ...rawRow, spots_filled_handson: 40 },
      { ...rawRow, id: other, spots_filled_handson: 0 },
    ],
    total: 2,
  }));
  mock.method(
    opportunitiesRepo,
    "countRosterByOpportunity",
    async () => new Map([[other, 3]]),
  );
  t.after(() => mock.restoreAll());

  const { items } = await adminOpportunitiesService.listForAdmin({});

  assert.equal(items[0].signup_count, 0);
  assert.equal(items[1].signup_count, 3);
});
