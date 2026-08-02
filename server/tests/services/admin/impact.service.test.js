const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const impactRepo = require("../../../src/data/impact.repo");
const adminImpactService = require("../../../src/services/admin/impact.service");

const period = {
  id: "iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii",
  label_en: "2024–25",
  label_zh: "2024–25年度",
  total_sessions: 120,
  families_served: 80,
  is_current: true,
};

test("listAdminImpact returns all periods with meta", async (t) => {
  mock.method(impactRepo, "listAll", async () => ({ rows: [period], total: 1 }));
  t.after(() => mock.restoreAll());

  const { items, meta } = await adminImpactService.listAdminImpact({ page: 1, limit: 12 });

  assert.equal(items.length, 1);
  assert.deepEqual(meta, { total: 1, page: 1, limit: 12 });
});

test("getAdminImpact throws 404 for unknown id", async (t) => {
  mock.method(impactRepo, "findById", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => adminImpactService.getAdminImpact("00000000-0000-0000-0000-000000000000"),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});

test("deleteAdminImpact throws 409 when trying to delete the current period", async (t) => {
  mock.method(impactRepo, "findById", async () => ({ ...period, is_current: true }));
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => adminImpactService.deleteAdminImpact(period.id),
    (err) => { assert.equal(err.status, 409); return true; },
  );
});

test("deleteAdminImpact succeeds for a non-current period", async (t) => {
  mock.method(impactRepo, "findById", async () => ({ ...period, is_current: false }));
  const removeFn = mock.fn(async () => ({}));
  mock.method(impactRepo, "remove", removeFn);
  t.after(() => mock.restoreAll());

  await adminImpactService.deleteAdminImpact(period.id);

  assert.equal(removeFn.mock.calls.length, 1);
});
