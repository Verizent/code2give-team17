const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const sessionsRepo = require("../../../src/data/sessions.repo");
const allocationsRepo = require("../../../src/data/allocations.repo");
const donorPeriodsRepo = require("../../../src/data/donor-periods.repo");
const {
  allocateForDonation,
} = require("../../../src/services/donations/allocation.service");

/**
 * These tests pin the §15 allocation contract to what the callers can observe:
 * how many rows get inserted, which sessions they name, what cost is snapshotted,
 * and how a donor_period is opened. The calendar boundaries themselves are already
 * covered by donation-periods.test.js — this suite tests the wiring.
 */

const donorId = "aaaaaaaa-0000-0000-0000-aaaaaaaaaaaa";
const periodId = "cccccccc-0000-0000-0000-cccccccccccc";

/** A donation made on the 5th (edition starts on the 15th, sends EOM). */
function donation(overrides = {}) {
  return {
    id: "bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb",
    donor_id: donorId,
    amount_hkd: 300,
    events_credited: 3,
    cost_per_event_at_donation: 100,
    tracking_opt_in: true,
    created_at: "2026-08-05T10:00:00Z",
    ...overrides,
  };
}

function session(id, startsAt) {
  return { id, starts_at: startsAt, title: `Session ${id}` };
}

/**
 * @param {import("node:test").TestContext} t
 * @param {{ sessions?: object[], period?: object, insertReturns?: object[] }} [opts]
 */
function mockDeps(t, { sessions = [], period, insertReturns } = {}) {
  const list = mock.method(sessionsRepo, "listEligibleForAllocation", async () => sessions);
  const findOrOpen = mock.method(
    donorPeriodsRepo,
    "findOrOpenForDonorWindow",
    async () => period ?? { id: periodId, donor_id: donorId, status: "open" },
  );
  const insertMany = mock.method(
    allocationsRepo,
    "insertMany",
    async (rows) => insertReturns ?? rows.map((r, i) => ({ id: `alloc-${i}`, ...r })),
  );
  t.after(() => mock.restoreAll());
  return { list, findOrOpen, insertMany };
}

test("allocateForDonation skips when tracking_opt_in is false — nothing is written", async (t) => {
  const deps = mockDeps(t, { sessions: [session("s1", "2026-08-20T10:00:00Z")] });

  const outcome = await allocateForDonation(donation({ tracking_opt_in: false }));

  assert.equal(outcome.skipped, true);
  assert.equal(outcome.allocations.length, 0);
  assert.equal(deps.list.mock.callCount(), 0, "must not even query sessions");
  assert.equal(deps.insertMany.mock.callCount(), 0);
});

test("allocateForDonation skips when events_credited is 0 — nothing to attach", async (t) => {
  const deps = mockDeps(t);
  const outcome = await allocateForDonation(donation({ events_credited: 0 }));

  assert.equal(outcome.skipped, true);
  assert.equal(deps.insertMany.mock.callCount(), 0);
});

test("allocateForDonation inserts one allocation per credited event when supply is ample", async (t) => {
  const sessions = [
    session("s1", "2026-08-20T10:00:00Z"),
    session("s2", "2026-08-22T10:00:00Z"),
    session("s3", "2026-08-24T10:00:00Z"),
    session("s4", "2026-08-26T10:00:00Z"),
  ];
  const deps = mockDeps(t, { sessions });

  const outcome = await allocateForDonation(donation({ events_credited: 3 }));

  assert.equal(outcome.allocations.length, 3, "one row per credited event");
  assert.equal(outcome.insufficient, false);
  assert.deepEqual(
    outcome.allocations.map((a) => a.session_id),
    ["s1", "s2", "s3"],
    "picks the first N from the ordered eligible list",
  );
});

test("allocateForDonation snapshots cost_at_allocation from the donation, not a live constant", async (t) => {
  const sessions = [session("s1", "2026-08-20T10:00:00Z")];
  const deps = mockDeps(t, { sessions });

  await allocateForDonation(
    donation({ events_credited: 1, cost_per_event_at_donation: 150 }),
  );

  const rows = deps.insertMany.mock.calls[0].arguments[0];
  assert.equal(rows[0].cost_at_allocation, 150, "revising costs later must not rewrite this");
});

test("allocateForDonation attaches the donor_period id and marks status pending", async (t) => {
  const sessions = [session("s1", "2026-08-20T10:00:00Z")];
  const deps = mockDeps(t, { sessions, period: { id: periodId } });

  await allocateForDonation(donation({ events_credited: 1 }));

  const rows = deps.insertMany.mock.calls[0].arguments[0];
  assert.equal(rows[0].donor_period_id, periodId);
  assert.equal(rows[0].donation_id, "bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb");
  assert.equal(rows[0].status, "pending", "sessions have not happened yet");
});

test("allocateForDonation reports insufficient when fewer sessions exist than events credited", async (t) => {
  // A large gift on a slow calendar week — supply < demand. Insert what exists;
  // the remainder is left for the pending-retry job (§16).
  const deps = mockDeps(t, { sessions: [session("s1", "2026-08-20T10:00:00Z")] });

  const outcome = await allocateForDonation(donation({ events_credited: 5 }));

  assert.equal(outcome.allocations.length, 1);
  assert.equal(outcome.insufficient, true);
  assert.equal(outcome.remaining, 4);
});

test("allocateForDonation opens a donor_period covering the donation's edition window", async (t) => {
  const sessions = [session("s1", "2026-08-20T10:00:00Z")];
  const deps = mockDeps(t, { sessions });

  // Donation on 5 Aug 2026 → edition [15 Aug, 31 Aug), sends 31 Aug.
  await allocateForDonation(donation());

  const [{ donorId: passedDonor, windowStart, windowEnd }] =
    deps.findOrOpen.mock.calls[0].arguments;
  assert.equal(passedDonor, donorId);
  assert.equal(windowStart.toISOString().slice(0, 10), "2026-08-15");
  assert.equal(windowEnd.toISOString().slice(0, 10), "2026-08-31");
});

test("allocateForDonation queries sessions with the rolling [+7d, +30d] window", async (t) => {
  // Updated donor-track spec: session eligibility is a rolling window a week to a month
  // ahead of the donation. Batching cadence (15th/EOM) is still fixed-calendar (see the
  // period-open test below) — the two are decoupled deliberately.
  const deps = mockDeps(t, { sessions: [] });
  await allocateForDonation(donation()); // donation.created_at = 2026-08-05T10:00:00Z

  const [{ windowStart, windowEnd, limit }] = deps.list.mock.calls[0].arguments;
  // 2026-08-05 + 7 days  = 2026-08-12
  // 2026-08-05 + 30 days = 2026-09-04
  assert.equal(windowStart.toISOString().slice(0, 10), "2026-08-12");
  assert.equal(windowEnd.toISOString().slice(0, 10), "2026-09-04");
  assert.equal(limit, 3);

  // The invariant, stated as a property rather than as two dates: no session can be credited
  // to a gift that predates it. This is the live guarantee — donation-periods.js's
  // `selectionStart` is not wired in, so its tests do not cover this.
  assert.ok(
    windowStart > new Date("2026-08-05T10:00:00Z"),
    "eligibility must never open before the donation itself",
  );
});

test("allocateForDonation caps supply query at events_credited — never over-fetches", async (t) => {
  const deps = mockDeps(t, { sessions: [] });
  await allocateForDonation(donation({ events_credited: 7 }));

  assert.equal(deps.list.mock.calls[0].arguments[0].limit, 7);
});

test("allocateForDonation returns insufficient=true with 0 allocations when no eligible sessions", async (t) => {
  const deps = mockDeps(t, { sessions: [] });
  const outcome = await allocateForDonation(donation({ events_credited: 2 }));

  assert.equal(outcome.allocations.length, 0);
  assert.equal(outcome.insufficient, true);
  assert.equal(outcome.remaining, 2);
  assert.equal(deps.insertMany.mock.callCount(), 0, "no rows to insert");
});
