const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const sessionsRepo = require("../../../src/data/sessions.repo");
const sessionsService = require("../../../src/services/admin/sessions.service");

const session = {
  id: "ssssssss-ssss-ssss-ssss-ssssssssssss",
  programme: "art",
  title_en: "Art Morning",
  title_zh: "藝術早晨",
  starts_at: "2026-08-10T09:00:00.000Z",
  ends_at: "2026-08-10T11:00:00.000Z",
  status: "scheduled",
  attendance_count: null,
  capacity: 20,
};

test("listSessions returns items and meta", async (t) => {
  mock.method(sessionsRepo, "listAll", async () => ({ rows: [session], total: 1 }));
  t.after(() => mock.restoreAll());

  const { items, meta } = await sessionsService.listSessions({ page: 1, limit: 12 });

  assert.equal(items.length, 1);
  assert.deepEqual(meta, { total: 1, page: 1, limit: 12 });
});

test("getSession throws 404 for unknown id", async (t) => {
  mock.method(sessionsRepo, "findById", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => sessionsService.getSession("00000000-0000-0000-0000-000000000000"),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});

test("recordBulkAttendance updates each session and returns count", async (t) => {
  const updateFn = mock.fn(async () => ({ ...session, attendance_count: 15 }));
  mock.method(sessionsRepo, "recordAttendance", updateFn);
  t.after(() => mock.restoreAll());

  const result = await sessionsService.recordBulkAttendance([
    { session_id: session.id, attendance_count: 15 },
  ]);

  assert.equal(result.updated, 1);
  assert.equal(updateFn.mock.calls.length, 1);
});

test("cancelSession sets status to cancelled", async (t) => {
  const updateFn = mock.fn(async () => ({ ...session, status: "cancelled" }));
  mock.method(sessionsRepo, "cancel", updateFn);
  t.after(() => mock.restoreAll());

  const result = await sessionsService.cancelSession(session.id);

  assert.equal(result.status, "cancelled");
});

test("cancelSession throws 404 for unknown id", async (t) => {
  mock.method(sessionsRepo, "cancel", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => sessionsService.cancelSession("00000000-0000-0000-0000-000000000000"),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});
