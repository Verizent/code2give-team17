const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const sessionsRepo = require("../../../src/data/sessions.repo");
const sessionsService = require("../../../src/services/admin/sessions.service");
// Recording attendance now also completes the donation allocations on that session and emails
// the donors who funded it. Stubbed here so these tests stay about the session write —
// session-lifecycle.service.test.js covers the donor side.
const sessionLifecycle = require("../../../src/services/donations/session-lifecycle.service");

const NO_DONOR_UPDATE = { allocations_completed: 0, donors_notified: 0, errors: [] };

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
  const notify = mock.method(sessionLifecycle, "onSessionCompleted", async () => NO_DONOR_UPDATE);
  t.after(() => mock.restoreAll());

  const result = await sessionsService.recordBulkAttendance([
    { session_id: session.id, attendance_count: 15 },
  ]);

  assert.equal(result.updated, 1);
  assert.equal(updateFn.mock.calls.length, 1);
  assert.equal(notify.mock.callCount(), 1, "donors on that session are told");
  assert.equal(notify.mock.calls[0].arguments[0], session.id);
});

test("recordAttendance completes the allocations on that session", async (t) => {
  // The link that did not exist: marking a session complete stopped at the session row, so
  // donation_allocations stayed `pending` for ever and the 15th/EOM donor update filtered an
  // always-empty set.
  mock.method(sessionsRepo, "recordAttendance", async () => ({ ...session, attendance_count: 12 }));
  const notify = mock.method(sessionLifecycle, "onSessionCompleted", async () => ({
    ...NO_DONOR_UPDATE,
    allocations_completed: 3,
    donors_notified: 2,
  }));
  t.after(() => mock.restoreAll());

  const result = await sessionsService.recordAttendance(session.id, { attendance_count: 12 });

  assert.equal(notify.mock.callCount(), 1);
  assert.equal(result.donor_update.donors_notified, 2);
  assert.equal(result.attendance_count, 12, "the session row is still returned");
});

test("cancelSession sets status to cancelled and rehomes the gifts on it", async (t) => {
  // Cancelling used to touch only sessions.status, stranding every allocation at `pending`:
  // the donor's period could never close, and their page counted a cancelled class under
  // "sessions on the way" while the card beside it read Cancelled.
  const updateFn = mock.fn(async () => ({ ...session, status: "cancelled" }));
  mock.method(sessionsRepo, "cancel", updateFn);
  const rehome = mock.method(sessionLifecycle, "onSessionCancelled", async () => ({
    session_id: session.id,
    reallocated: 2,
    cancelled: 0,
    moves: [],
  }));
  t.after(() => mock.restoreAll());

  const result = await sessionsService.cancelSession(session.id);

  assert.equal(result.status, "cancelled");
  assert.equal(rehome.mock.callCount(), 1);
  assert.equal(rehome.mock.calls[0].arguments[0], session.id);
  assert.equal(result.reallocation.reallocated, 2);
});

test("cancelSession throws 404 for unknown id", async (t) => {
  mock.method(sessionsRepo, "cancel", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => sessionsService.cancelSession("00000000-0000-0000-0000-000000000000"),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});
