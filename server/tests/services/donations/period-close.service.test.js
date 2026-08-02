const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const donorPeriodsRepo = require("../../../src/data/donor-periods.repo");
const allocationsRepo = require("../../../src/data/allocations.repo");
const sessionsRepo = require("../../../src/data/sessions.repo");
const donorsRepo = require("../../../src/data/donors.repo");
const email = require("../../../src/lib/email");

const { closeReadyPeriods } = require("../../../src/services/donations/period-close.service");

test("closeReadyPeriods skips empty periods — no email, no state change (§Phase B)", async (t) => {
  const emailSpy = mock.method(email, "sendEmail", async () => ({ mode: "log", delivered: true }));
  const updatePeriod = mock.method(donorPeriodsRepo, "updatePeriod", async () => {});
  mock.method(donorPeriodsRepo, "listDueForClose", async () => [
    { id: "p1", donor_id: "d1", period_start: "2026-07-15", period_end: "2026-07-31" },
  ]);
  mock.method(allocationsRepo, "listByPeriod", async () => [
    { id: "a1", session_id: "s1", status: "pending", email_sent_at: null },
  ]);
  mock.method(allocationsRepo, "updateAllocation", async () => {});
  mock.method(sessionsRepo, "listByIds", async () => []);
  mock.method(donorsRepo, "findById", async () => ({ id: "d1", email: "a@b.com", access_token: "tok" }));
  t.after(() => mock.restoreAll());

  const result = await closeReadyPeriods();

  assert.equal(result.skipped_empty, 1);
  assert.equal(result.closed, 0);
  assert.equal(emailSpy.mock.callCount(), 0, "no email for empty period");
  assert.equal(updatePeriod.mock.callCount(), 0);
});

test("closeReadyPeriods emails completed allocations and stamps email_sent_at", async (t) => {
  const emailSpy = mock.method(email, "sendEmail", async () => ({ mode: "log", delivered: true }));
  const updateAllocation = mock.method(allocationsRepo, "updateAllocation", async () => {});
  const updatePeriod = mock.method(donorPeriodsRepo, "updatePeriod", async () => {});
  mock.method(donorPeriodsRepo, "listDueForClose", async () => [
    { id: "p1", donor_id: "d1", period_start: "2026-07-15", period_end: "2026-07-31" },
  ]);
  mock.method(allocationsRepo, "listByPeriod", async () => [
    { id: "a1", session_id: "s1", status: "completed", email_sent_at: null },
    { id: "a2", session_id: "s2", status: "completed", email_sent_at: null },
    { id: "a3", session_id: "s3", status: "pending",   email_sent_at: null }, // excluded
  ]);
  mock.method(sessionsRepo, "listByIds", async () => [
    { id: "s1", title_en: "Yoga", starts_at: "2026-07-20T10:00:00Z", attendance_count: 10 },
    { id: "s2", title_en: "Art",  starts_at: "2026-07-25T10:00:00Z", attendance_count: null },
  ]);
  mock.method(donorsRepo, "findById", async () => ({ id: "d1", email: "alex@example.com", access_token: "tok" }));
  t.after(() => mock.restoreAll());

  const result = await closeReadyPeriods();

  assert.equal(result.closed, 1);
  assert.equal(result.emailed, 1);
  assert.equal(emailSpy.mock.callCount(), 1);
  assert.equal(emailSpy.mock.calls[0].arguments[0].to, "alex@example.com");

  // Stamps email_sent_at on exactly the completed rows.
  assert.equal(updateAllocation.mock.callCount(), 2);
  const stampedIds = updateAllocation.mock.calls.map((c) => c.arguments[0]);
  assert.deepEqual(stampedIds.sort(), ["a1", "a2"]);
  for (const call of updateAllocation.mock.calls) {
    assert.ok(call.arguments[1].email_sent_at, "stamps a timestamp");
  }

  // Closes the period.
  assert.equal(updatePeriod.mock.callCount(), 1);
  assert.equal(updatePeriod.mock.calls[0].arguments[1].status, "closed");
});

test("closeReadyPeriods skips completed allocations that already have email_sent_at (idempotent)", async (t) => {
  const emailSpy = mock.method(email, "sendEmail", async () => ({ mode: "log", delivered: true }));
  mock.method(donorPeriodsRepo, "listDueForClose", async () => [
    { id: "p1", donor_id: "d1", period_start: "2026-07-15", period_end: "2026-07-31" },
  ]);
  mock.method(allocationsRepo, "listByPeriod", async () => [
    { id: "a1", session_id: "s1", status: "completed", email_sent_at: "2026-07-31T00:00:00Z" },
  ]);
  mock.method(allocationsRepo, "updateAllocation", async () => {});
  mock.method(donorPeriodsRepo, "updatePeriod", async () => {});
  mock.method(sessionsRepo, "listByIds", async () => []);
  mock.method(donorsRepo, "findById", async () => ({ id: "d1", email: "a@b.com", access_token: "tok" }));
  t.after(() => mock.restoreAll());

  const result = await closeReadyPeriods();

  assert.equal(result.skipped_empty, 1, "no new completed items — treated as empty");
  assert.equal(emailSpy.mock.callCount(), 0, "already-emailed items don't re-fire");
});
