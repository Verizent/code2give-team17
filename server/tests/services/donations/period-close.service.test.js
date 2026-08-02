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

  // Does NOT close: a3 is still pending, so this donor has more to hear about. Closing here
  // would strand a3 forever — listDueForClose only returns periods with status='open'.
  assert.equal(updatePeriod.mock.callCount(), 1, "still stamps emailed_at");
  assert.equal(updatePeriod.mock.calls[0].arguments[1].status, undefined, "stays open");
  assert.ok(updatePeriod.mock.calls[0].arguments[1].emailed_at);
  assert.equal(result.closed, 0, "emailed but not closed");
});

test("the batch email carries an absolute link to a route the client serves", async (t) => {
  // This read `/help/donate/track/<token>` — a path App.jsx does not define, so it hit the `*`
  // catch-all and redirected home, and relative besides, which is not clickable from an inbox.
  // The tracking link is the donor's only route back to their giving history (§15 has no
  // lookup-by-email), so a broken one costs them exactly what this email exists to give.
  const emailSpy = mock.method(email, "sendEmail", async () => ({ mode: "log", delivered: true }));
  mock.method(allocationsRepo, "updateAllocation", async () => {});
  mock.method(donorPeriodsRepo, "updatePeriod", async () => {});
  mock.method(donorPeriodsRepo, "listDueForClose", async () => [
    { id: "p1", donor_id: "d1", period_start: "2026-07-15", period_end: "2026-07-31" },
  ]);
  mock.method(allocationsRepo, "listByPeriod", async () => [
    { id: "a1", session_id: "s1", status: "completed", email_sent_at: null },
  ]);
  mock.method(sessionsRepo, "listByIds", async () => [
    { id: "s1", title_en: "Yoga", starts_at: "2026-07-20T10:00:00Z", attendance_count: 10 },
  ]);
  mock.method(donorsRepo, "findById", async () => ({ id: "d1", email: "a@b.com", access_token: "tok_x" }));
  t.after(() => mock.restoreAll());

  await closeReadyPeriods({ clientOrigin: "https://love21.example" });

  const body = emailSpy.mock.calls[0].arguments[0].text;
  assert.match(body, /https:\/\/love21\.example\/give\/track\/tok_x/);
  assert.doesNotMatch(body, /\/help\/donate\//, "the old dead path must not return");
});

test("closeReadyPeriods closes the period once every allocation is terminal", async (t) => {
  // Same shape as above but a3 is cancelled rather than pending. Cancelled is terminal —
  // it can produce no further news — so there is nothing left to tell this donor.
  mock.method(email, "sendEmail", async () => ({ mode: "log", delivered: true }));
  const updatePeriod = mock.method(donorPeriodsRepo, "updatePeriod", async () => {});
  mock.method(allocationsRepo, "updateAllocation", async () => {});
  mock.method(donorPeriodsRepo, "listDueForClose", async () => [
    { id: "p1", donor_id: "d1", period_start: "2026-07-15", period_end: "2026-07-31" },
  ]);
  mock.method(allocationsRepo, "listByPeriod", async () => [
    { id: "a1", session_id: "s1", status: "completed", email_sent_at: null },
    { id: "a2", session_id: "s2", status: "cancelled", email_sent_at: null },
  ]);
  mock.method(sessionsRepo, "listByIds", async () => [
    { id: "s1", title_en: "Yoga", starts_at: "2026-07-20T10:00:00Z", attendance_count: 10 },
  ]);
  mock.method(donorsRepo, "findById", async () => ({ id: "d1", email: "a@b.com", access_token: "t" }));
  t.after(() => mock.restoreAll());

  const result = await closeReadyPeriods();

  assert.equal(result.closed, 1);
  assert.equal(updatePeriod.mock.calls[0].arguments[1].status, "closed");
});

test("closeReadyPeriods sends a follow-up covering only newly-completed sessions", async (t) => {
  // The run after the one above: a3 has since completed, a1/a2 already carry email_sent_at.
  // The donor must hear about a3 — and must NOT be told about a1/a2 a second time.
  const emailSpy = mock.method(email, "sendEmail", async () => ({ mode: "log", delivered: true }));
  const updateAllocation = mock.method(allocationsRepo, "updateAllocation", async () => {});
  const updatePeriod = mock.method(donorPeriodsRepo, "updatePeriod", async () => {});
  mock.method(donorPeriodsRepo, "listDueForClose", async () => [
    { id: "p1", donor_id: "d1", period_start: "2026-07-15", period_end: "2026-07-31" },
  ]);
  mock.method(allocationsRepo, "listByPeriod", async () => [
    { id: "a1", session_id: "s1", status: "completed", email_sent_at: "2026-07-31T00:00:00Z" },
    { id: "a2", session_id: "s2", status: "completed", email_sent_at: "2026-07-31T00:00:00Z" },
    { id: "a3", session_id: "s3", status: "completed", email_sent_at: null },
  ]);
  mock.method(sessionsRepo, "listByIds", async () => [
    { id: "s3", title_en: "Floor curling", starts_at: "2026-07-28T10:00:00Z", attendance_count: 9 },
  ]);
  mock.method(donorsRepo, "findById", async () => ({ id: "d1", email: "a@b.com", access_token: "t" }));
  t.after(() => mock.restoreAll());

  const result = await closeReadyPeriods();

  const body = emailSpy.mock.calls[0].arguments[0].text;
  assert.match(body, /Floor curling/, "the newly-completed session is reported");
  assert.doesNotMatch(body, /Yoga|Art/, "already-emailed sessions are not repeated");

  assert.equal(updateAllocation.mock.callCount(), 1, "only a3 is stamped");
  assert.equal(updateAllocation.mock.calls[0].arguments[0], "a3");

  assert.equal(result.closed, 1, "everything terminal now — period finally closes");
  assert.equal(updatePeriod.mock.calls[0].arguments[1].status, "closed");
});

test("closeReadyPeriods lists a session once even when several donations landed on it", async (t) => {
  // A donor who gave twice into the same edition can hold two allocations pointing at the
  // same session. Mapping over allocations would print it twice and read as though the
  // session ran twice.
  const emailSpy = mock.method(email, "sendEmail", async () => ({ mode: "log", delivered: true }));
  mock.method(allocationsRepo, "updateAllocation", async () => {});
  mock.method(donorPeriodsRepo, "updatePeriod", async () => {});
  mock.method(donorPeriodsRepo, "listDueForClose", async () => [
    { id: "p1", donor_id: "d1", period_start: "2026-07-15", period_end: "2026-07-31" },
  ]);
  mock.method(allocationsRepo, "listByPeriod", async () => [
    // Two gifts, same session.
    { id: "a1", donation_id: "d-one", session_id: "s1", status: "completed", email_sent_at: null },
    { id: "a2", donation_id: "d-two", session_id: "s1", status: "completed", email_sent_at: null },
    { id: "a3", donation_id: "d-two", session_id: "s2", status: "completed", email_sent_at: null },
  ]);
  mock.method(sessionsRepo, "listByIds", async () => [
    { id: "s1", title_en: "Yoga", starts_at: "2026-07-20T10:00:00Z", attendance_count: 10 },
    { id: "s2", title_en: "Art",  starts_at: "2026-07-25T10:00:00Z", attendance_count: 8 },
  ]);
  mock.method(donorsRepo, "findById", async () => ({ id: "d1", email: "a@b.com", access_token: "t" }));
  t.after(() => mock.restoreAll());

  await closeReadyPeriods();

  const body = emailSpy.mock.calls[0].arguments[0].text;
  const yogaLines = body.split("\n").filter((l) => l.includes("Yoga"));
  assert.equal(yogaLines.length, 1, "Yoga is listed once despite two allocations");
  assert.equal(body.split("\n").filter((l) => l.trim().startsWith("·")).length, 2, "two sessions total");
  // Chronological, so the email reads as a timeline.
  assert.ok(body.indexOf("Yoga") < body.indexOf("Art"), "ordered by starts_at");
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
