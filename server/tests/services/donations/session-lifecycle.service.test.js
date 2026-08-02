const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const allocationsRepo = require("../../../src/data/allocations.repo");
const sessionsRepo = require("../../../src/data/sessions.repo");
const donorsRepo = require("../../../src/data/donors.repo");
const emailLib = require("../../../src/lib/email");
const {
  onSessionCompleted,
  onSessionCancelled,
} = require("../../../src/services/donations/session-lifecycle.service");

const SESSION_ID = "ssss0000-0000-0000-0000-000000000001";
const ORIGIN = "http://localhost:5173";

const SESSION = {
  id: SESSION_ID,
  title_en: "Floor curling drop-in",
  title_zh: "地板冰壺",
  location_en: "Kwun Tong Studio",
  starts_at: "2026-08-12T02:30:00+00:00",
  attendance_count: 14,
};

const DONOR_A = {
  id: "d1",
  email: "mei@example.com",
  full_name: "Mei Chan",
  access_token: "tok_mei",
  tracking_opt_in: true,
};
const DONOR_B = {
  id: "d2",
  email: "sam@example.com",
  full_name: "Sam",
  access_token: "tok_sam",
  tracking_opt_in: true,
};

function stub(t, { allocations, session = SESSION, donors = [DONOR_A, DONOR_B] }) {
  const byId = new Map(donors.map((d) => [d.id, d]));
  const listBySession = mock.method(allocationsRepo, "listBySession", async () => allocations);
  const updateAllocation = mock.method(allocationsRepo, "updateAllocation", async () => ({}));
  mock.method(sessionsRepo, "findById", async () => session);
  mock.method(donorsRepo, "findById", async (id) => byId.get(id) ?? null);
  const sendEmail = mock.method(emailLib, "sendEmail", async () => ({ mode: "log", delivered: true }));
  t.after(() => mock.restoreAll());
  return { listBySession, updateAllocation, sendEmail };
}

function alloc(id, donorId, status = "pending") {
  return { id, donation_id: `dn_${id}`, session_id: SESSION_ID, donor_id: donorId, status };
}

/**
 * Per-session emails are off by default, so every test that expects one has to opt in — the
 * same way an operator does. Restored after each test so ordering cannot leak.
 */
function withPerSessionEmails(t, value = "on") {
  const saved = process.env.SESSION_COMPLETION_EMAILS;
  process.env.SESSION_COMPLETION_EMAILS = value;
  t.after(() => {
    if (saved === undefined) delete process.env.SESSION_COMPLETION_EMAILS;
    else process.env.SESSION_COMPLETION_EMAILS = saved;
  });
}

// ── onSessionCancelled ──────────────────────────────────────────────────────

const donationsRepo = require("../../../src/data/donations.repo");

const REPLACEMENTS = [
  { id: "s_next1", title_en: "Dance and movement", starts_at: "2026-08-20T02:00:00Z" },
  { id: "s_next2", title_en: "Art morning", starts_at: "2026-08-22T02:00:00Z" },
];

function stubCancel(t, { allocations, candidates = REPLACEMENTS, donorAllocations = null }) {
  mock.method(allocationsRepo, "listBySession", async () => allocations);
  mock.method(allocationsRepo, "listByDonor", async () => donorAllocations ?? allocations);
  mock.method(donationsRepo, "findById", async () => ({
    id: "dn1",
    created_at: "2026-08-02T00:00:00Z",
  }));
  mock.method(sessionsRepo, "listEligibleForAllocation", async () => candidates);
  const updateAllocation = mock.method(allocationsRepo, "updateAllocation", async () => ({}));
  t.after(() => mock.restoreAll());
  return { updateAllocation };
}

test("a cancelled session moves its pending gifts to another session", async (t) => {
  // The donor gave to fund classes. A class not running is ours to solve — recording their
  // gift as having paid for something that never happened is the one plainly wrong outcome.
  const deps = stubCancel(t, { allocations: [alloc("a1", "d1")] });

  const result = await onSessionCancelled(SESSION_ID);

  assert.equal(result.reallocated, 1);
  assert.equal(result.cancelled, 0);
  const [id, patch] = deps.updateAllocation.mock.calls[0].arguments;
  assert.equal(id, "a1");
  assert.equal(patch.session_id, "s_next1", "points at a new session");
  assert.equal(patch.status, undefined, "status stays pending — the gift is redirected, not spent");
});

test("a pending allocation on a still-scheduled session is never touched", async (t) => {
  // The rule is driven by what happened to the session, not by the allocation being pending:
  //   completed → complete the allocation
  //   cancelled → move it
  //   scheduled → leave it alone
  const deps = stubCancel(t, { allocations: [] });

  const result = await onSessionCancelled(SESSION_ID);

  assert.deepEqual(result, { session_id: SESSION_ID, reallocated: 0, cancelled: 0, moves: [] });
  assert.equal(deps.updateAllocation.mock.callCount(), 0);
});

test("already-terminal allocations are not reallocated", async (t) => {
  // A completed allocation records a class the donor genuinely funded. Cancelling the session
  // afterwards is an admin correction and must not rewrite their history.
  const deps = stubCancel(t, {
    allocations: [alloc("a1", "d1", "completed"), alloc("a2", "d1", "cancelled")],
  });

  const result = await onSessionCancelled(SESSION_ID);

  assert.equal(result.reallocated, 0);
  assert.equal(deps.updateAllocation.mock.callCount(), 0);
});

test("the replacement is never a session the donor already funds", async (t) => {
  // Otherwise a donor who funded three distinct classes silently collapses to two.
  const deps = stubCancel(t, {
    allocations: [alloc("a1", "d1")],
    donorAllocations: [
      { id: "a1", session_id: SESSION_ID, status: "pending" },
      { id: "a9", session_id: "s_next1", status: "pending" },
    ],
  });

  await onSessionCancelled(SESSION_ID);

  assert.equal(
    deps.updateAllocation.mock.calls[0].arguments[1].session_id,
    "s_next2",
    "skips s_next1, which the donor already holds",
  );
});

test("with nothing eligible left, the allocation is cancelled so the period can close", async (t) => {
  // Terminal is the point: leaving it pending hangs the donor's period open for ever on a
  // class that will never run.
  const deps = stubCancel(t, { allocations: [alloc("a1", "d1")], candidates: [] });

  const result = await onSessionCancelled(SESSION_ID);

  assert.equal(result.reallocated, 0);
  assert.equal(result.cancelled, 1);
  assert.deepEqual(deps.updateAllocation.mock.calls[0].arguments[1], { status: "cancelled" });
});

test("every donor on a cancelled session is moved, not just the first", async (t) => {
  const deps = stubCancel(t, {
    allocations: [alloc("a1", "d1"), alloc("a2", "d2")],
    donorAllocations: [],
  });

  const result = await onSessionCancelled(SESSION_ID);

  assert.equal(result.reallocated, 2);
  assert.equal(deps.updateAllocation.mock.callCount(), 2);
});

// ── onSessionCompleted ──────────────────────────────────────────────────────

test("OFF by default: allocations still complete, and no email goes out", async (t) => {
  // This is the shipped behaviour and the specified cadence — donors hear on the 15th/EOM, in
  // one digest. The flag must gate the EMAIL only: completing the allocation is a data fix,
  // and gating it too would restore the original bug where period-close.service.js filtered
  // `status === "completed"` over a set nothing ever populated, so the batch reported nothing.
  const saved = process.env.SESSION_COMPLETION_EMAILS;
  delete process.env.SESSION_COMPLETION_EMAILS;
  t.after(() => {
    if (saved !== undefined) process.env.SESSION_COMPLETION_EMAILS = saved;
  });
  const deps = stub(t, { allocations: [alloc("a1", "d1"), alloc("a2", "d2")] });

  const result = await onSessionCompleted(SESSION_ID, { clientOrigin: ORIGIN });

  assert.equal(result.allocations_completed, 2, "the data fix is not behind the flag");
  assert.equal(result.emails_disabled, true);
  assert.equal(result.donors_notified, 0);
  assert.equal(deps.sendEmail.mock.callCount(), 0, "nothing sent");

  // Unstamped is what makes the batch pick these up. Stamping here would silently swallow the
  // donor's only update.
  const stamped = deps.updateAllocation.mock.calls.filter((c) => c.arguments[1].email_sent_at);
  assert.equal(stamped.length, 0, "email_sent_at must stay null for the batch");
});

test("any value other than 'on' leaves per-session emails off", async (t) => {
  // A truthy-looking value must not silently enable a different donor promise.
  for (const value of ["off", "true", "1", "yes", ""]) {
    mock.restoreAll();
    const saved = process.env.SESSION_COMPLETION_EMAILS;
    process.env.SESSION_COMPLETION_EMAILS = value;
    const deps = stub(t, { allocations: [alloc("a1", "d1")] });

    const result = await onSessionCompleted(SESSION_ID, { clientOrigin: ORIGIN });
    assert.equal(deps.sendEmail.mock.callCount(), 0, `"${value}" must not enable emails`);
    assert.equal(result.allocations_completed, 1, `"${value}" must still complete allocations`);

    if (saved === undefined) delete process.env.SESSION_COMPLETION_EMAILS;
    else process.env.SESSION_COMPLETION_EMAILS = saved;
  }
});

test("ON is case-insensitive", async (t) => {
  withPerSessionEmails(t, "ON");
  const deps = stub(t, { allocations: [alloc("a1", "d1")] });

  await onSessionCompleted(SESSION_ID, { clientOrigin: ORIGIN });

  assert.equal(deps.sendEmail.mock.callCount(), 1);
});

test("completing a session completes its allocations and emails the donors", async (t) => {
  // The gap this closes: recording attendance set sessions.status and nothing else, so
  // donation_allocations stayed `pending` for ever and the 15th/EOM update — which filters on
  // status === "completed" — reported an always-empty set.
  withPerSessionEmails(t);
  const deps = stub(t, { allocations: [alloc("a1", "d1"), alloc("a2", "d2")] });

  const result = await onSessionCompleted(SESSION_ID, { clientOrigin: ORIGIN });

  assert.equal(result.allocations_completed, 2);
  assert.equal(result.donors_notified, 2);

  const statusWrites = deps.updateAllocation.mock.calls.filter(
    (c) => c.arguments[1].status === "completed",
  );
  assert.equal(statusWrites.length, 2, "both allocations advanced");

  const recipients = deps.sendEmail.mock.calls.map((c) => c.arguments[0].to).sort();
  assert.deepEqual(recipients, ["mei@example.com", "sam@example.com"]);
});

test("a donor with two allocations on one session is emailed once", async (t) => {
  // Two gifts can land on the same session — the allocator picks soonest-first and does not
  // exclude what an earlier gift funded. Two identical "your session happened" emails reads
  // as a bug, the same way duplicate rows did on the tracking page.
  withPerSessionEmails(t);
  const deps = stub(t, { allocations: [alloc("a1", "d1"), alloc("a2", "d1")] });

  const result = await onSessionCompleted(SESSION_ID, { clientOrigin: ORIGIN });

  assert.equal(result.allocations_completed, 2, "both rows still advance");
  assert.equal(result.donors_notified, 1);
  assert.equal(deps.sendEmail.mock.callCount(), 1, "one email, not two");
});

test("the email names the session and carries the tracking link", async (t) => {
  withPerSessionEmails(t);
  const deps = stub(t, { allocations: [alloc("a1", "d1")] });

  await onSessionCompleted(SESSION_ID, { clientOrigin: ORIGIN });

  const message = deps.sendEmail.mock.calls[0].arguments[0];
  assert.match(message.subject, /Floor curling drop-in/);
  assert.match(message.text, /Floor curling drop-in/);
  // 02:30 UTC is a 10:30 morning class in Hong Kong.
  assert.match(message.text, /Wed 12 Aug · 10:30 · Kwun Tong Studio/);
  assert.match(message.text, /14 members came along/);
  assert.ok(message.text.includes(`${ORIGIN}/give/track/tok_mei`));
});

test("already-terminal allocations are left alone", async (t) => {
  // Re-recording attendance on a session must not re-email everyone who funded it.
  withPerSessionEmails(t);
  const deps = stub(t, {
    allocations: [alloc("a1", "d1", "completed"), alloc("a2", "d2", "cancelled")],
  });

  const result = await onSessionCompleted(SESSION_ID, { clientOrigin: ORIGIN });

  assert.equal(result.allocations_completed, 0);
  assert.equal(result.donors_notified, 0);
  assert.equal(deps.sendEmail.mock.callCount(), 0);
});

test("email_sent_at is stamped only after a successful send", async (t) => {
  // That flag is what stops period-close.service.js reporting the same session again. Stamping
  // it on a failed send would lose the donor's update entirely; leaving it unset means the
  // batch picks it up.
  withPerSessionEmails(t);
  const deps = stub(t, { allocations: [alloc("a1", "d1")] });
  deps.sendEmail.mock.mockImplementation(async () => {
    throw new Error("SMTP is on fire");
  });

  const result = await onSessionCompleted(SESSION_ID, { clientOrigin: ORIGIN });

  assert.equal(result.allocations_completed, 1, "status still advances — that is durable");
  assert.equal(result.donors_notified, 0);
  assert.equal(result.errors.length, 1);
  const stamped = deps.updateAllocation.mock.calls.filter((c) => c.arguments[1].email_sent_at);
  assert.equal(stamped.length, 0, "no stamp on a failed send");
});

test("a mail failure for one donor does not stop the next", async (t) => {
  withPerSessionEmails(t);
  const deps = stub(t, { allocations: [alloc("a1", "d1"), alloc("a2", "d2")] });
  let call = 0;
  deps.sendEmail.mock.mockImplementation(async () => {
    call++;
    if (call === 1) throw new Error("greylisted");
    return { mode: "log", delivered: true };
  });

  const result = await onSessionCompleted(SESSION_ID, { clientOrigin: ORIGIN });

  assert.equal(result.donors_notified, 1, "the second donor is still told");
  assert.equal(result.errors.length, 1);
});

test("an opted-out donor gets the news without the tracking link", async (t) => {
  withPerSessionEmails(t);
  const deps = stub(t, {
    allocations: [alloc("a1", "d1")],
    donors: [{ ...DONOR_A, tracking_opt_in: false }],
  });

  await onSessionCompleted(SESSION_ID, { clientOrigin: ORIGIN });

  const { text } = deps.sendEmail.mock.calls[0].arguments[0];
  assert.equal(text.includes("/give/track/"), false);
  assert.match(text, /Floor curling drop-in/);
});

test("a session with no attendance recorded omits the headcount rather than saying zero", async (t) => {
  withPerSessionEmails(t);
  const deps = stub(t, {
    allocations: [alloc("a1", "d1")],
    session: { ...SESSION, attendance_count: null },
  });

  await onSessionCompleted(SESSION_ID, { clientOrigin: ORIGIN });

  const { text } = deps.sendEmail.mock.calls[0].arguments[0];
  assert.equal(/came along/.test(text), false, "no headcount line at all");
  assert.equal(/0 members/.test(text), false, "and certainly not zero");
});

test("a session nobody funded is a no-op", async (t) => {
  withPerSessionEmails(t);
  const deps = stub(t, { allocations: [] });

  const result = await onSessionCompleted(SESSION_ID, { clientOrigin: ORIGIN });

  assert.deepEqual(result, {
    session_id: SESSION_ID,
    allocations_completed: 0,
    donors_notified: 0,
    errors: [],
  });
  assert.equal(deps.sendEmail.mock.callCount(), 0);
});
