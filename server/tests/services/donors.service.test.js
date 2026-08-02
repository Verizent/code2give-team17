const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const donorsRepo = require("../../src/data/donors.repo");
const donationsRepo = require("../../src/data/donations.repo");
const allocationsRepo = require("../../src/data/allocations.repo");
const donorPeriodsRepo = require("../../src/data/donor-periods.repo");
const sessionsRepo = require("../../src/data/sessions.repo");
const { upsertDonor, buildTrackView } = require("../../src/services/donors.service");

// Minimal stub shape the repo returns
const stubDonor = {
  id: "aaaaaaaa-0000-0000-0000-aaaaaaaaaaaa",
  email: "alice@example.com",
  access_token: "tok_abc",
  full_name: null,
  tracking_opt_in: true,
};

test("upsertDonor normalises the email before lookup and storage", async (t) => {
  const findByEmail = mock.method(donorsRepo, "findByEmail", async () => null);
  mock.method(donorsRepo, "createDonor", async (row) => ({ ...stubDonor, email: row.email }));
  t.after(() => mock.restoreAll());

  await upsertDonor({ email: "  ALICE@Example.COM  ", trackingOptIn: true });

  const calledWith = findByEmail.mock.calls[0].arguments[0];
  assert.equal(calledWith, "alice@example.com", "lookup uses normalised email");
});

test("upsertDonor never re-opts-in a donor who opted out", async (t) => {
  // Consent is not a side effect of somebody else donating. POST /api/donations is
  // unauthenticated and takes an arbitrary email, so a third party could previously flip
  // an opted-out supporter back to opted-in just by submitting their address. Opting back
  // in is a deliberate act that belongs to the donor, not to whoever posts a form.
  const optedOut = { ...stubDonor, tracking_opt_in: false };
  mock.method(donorsRepo, "findByEmail", async () => optedOut);
  const updateDonor = mock.method(donorsRepo, "updateDonor", async () => optedOut);
  t.after(() => mock.restoreAll());

  const result = await upsertDonor({ email: "alice@example.com", trackingOptIn: true });

  assert.equal(result.tracking_opt_in, false, "must stay opted out");
  const flipped = updateDonor.mock.calls.some(
    (call) => call.arguments[1]?.tracking_opt_in === true,
  );
  assert.equal(flipped, false, "must not write tracking_opt_in back to true");
});

test("upsertDonor returns the existing donor without creating a new one", async (t) => {
  mock.method(donorsRepo, "findByEmail", async () => stubDonor);
  const createDonor = mock.method(donorsRepo, "createDonor", async () => {
    throw new Error("should not create when donor already exists");
  });
  t.after(() => mock.restoreAll());

  const result = await upsertDonor({ email: "alice@example.com", trackingOptIn: true });

  assert.equal(result.id, stubDonor.id);
  assert.equal(createDonor.mock.calls.length, 0);
});

test("upsertDonor creates a new donor when email is not found", async (t) => {
  mock.method(donorsRepo, "findByEmail", async () => null);
  const createDonor = mock.method(donorsRepo, "createDonor", async (row) => ({
    ...stubDonor,
    email: row.email,
  }));
  t.after(() => mock.restoreAll());

  await upsertDonor({ email: "new@example.com", trackingOptIn: true });

  assert.equal(createDonor.mock.calls.length, 1);
  assert.equal(createDonor.mock.calls[0].arguments[0].email, "new@example.com");
});

test("upsertDonor access_token is stable — same donor returns same token", async (t) => {
  mock.method(donorsRepo, "findByEmail", async () => stubDonor);
  mock.method(donorsRepo, "updateDonor", async () => {});
  t.after(() => mock.restoreAll());

  const first = await upsertDonor({ email: "alice@example.com", trackingOptIn: true });
  const second = await upsertDonor({ email: "alice@example.com", trackingOptIn: true });

  assert.equal(first.access_token, second.access_token);
});

/**
 * buildTrackView — the §15 tracking page composer, shaped for PLAN.md §C1.
 *
 * Shape reference (from PLAN.md — this is what FE3 builds against):
 *   donor.supporter_since       — moved out of lifetime
 *   lifetime.sessions_supported — DISTINCT completed
 *   lifetime.sessions_on_the_way— DISTINCT pending + planned  (renamed from on_the_way)
 *   lifetime.total_given_hkd    — SUM succeeded amounts        (renamed from total_given)
 *   lifetime.donation_count     — COUNT succeeded donations    (NEW)
 *   period.id/period_start/period_end/status
 *   period.is_current           — boolean; true iff status='open'
 *   period.events_credited      — sum of donations.events_credited landing in this window
 *   period.events_shown         — length of events array
 *   period.events[]             — {kind, id, title, starts_at, location, status,
 *                                  expected_participants, attendance_count, photo_url}
 *   periods[]                   — {id, label, status} — archive list, newest first
 *
 * Note: `allocations` key is GONE — PLAN.md §Phase B: "there is no `allocations` key and
 * no per-event `status` of `pending`/`planned` — those belonged to the deleted allocation
 * model. An event's state is the event's own `scheduled | completed | cancelled`."
 * Internally the allocation table still exists on this branch (Option C compromise); the
 * response never surfaces it.
 */

const trackDonor = {
  id: "d1",
  email: "alex@example.com",
  full_name: "Alex",
  locale: "en",
};

function stubTrackDeps(t, { allocs = [], donations = [], periods = [], sessions = [] } = {}) {
  mock.method(allocationsRepo, "listByDonor", async () => allocs);
  mock.method(donationsRepo, "listByDonor", async () => donations);
  mock.method(donorPeriodsRepo, "listByDonor", async () => periods);
  mock.method(sessionsRepo, "listByIds", async () => sessions);
  t.after(() => mock.restoreAll());
}

test("buildTrackView returns zero lifetime totals for a new donor", async (t) => {
  stubTrackDeps(t);
  const view = await buildTrackView(trackDonor);

  assert.equal(view.lifetime.sessions_supported, 0);
  assert.equal(view.lifetime.sessions_on_the_way, 0);
  assert.equal(view.lifetime.total_given_hkd, 0);
  assert.equal(view.lifetime.donation_count, 0);
  assert.equal(view.donor.supporter_since, null, "moved from lifetime to donor per PLAN.md §C1");
});

test("buildTrackView.donor carries full_name and supporter_since only (email optional)", async (t) => {
  stubTrackDeps(t, {
    donations: [{ amount_hkd: 300, status: "succeeded", created_at: "2026-06-01T00:00:00Z" }],
  });
  const view = await buildTrackView(trackDonor);

  assert.equal(view.donor.full_name, "Alex");
  assert.equal(view.donor.supporter_since, "2026-06-01T00:00:00Z");
});

test("buildTrackView.lifetime.people_reached sums attendance_count over completed sessions", async (t) => {
  // The 'cumulative page' requirement: total people from completed sessions the donor supported.
  // Null attendance (session ran but staff haven't entered a count) → treated as 0, not omitted,
  // so the number is truthful. Same session appearing on two allocations counts once.
  stubTrackDeps(t, {
    allocs: [
      { session_id: "s1", status: "completed", donor_period_id: "p1", cost_at_allocation: 500 },
      { session_id: "s1", status: "completed", donor_period_id: "p1", cost_at_allocation: 500 },
      { session_id: "s2", status: "completed", donor_period_id: "p1", cost_at_allocation: 500 },
      { session_id: "s3", status: "completed", donor_period_id: "p1", cost_at_allocation: 500 },
      { session_id: "s4", status: "pending",   donor_period_id: "p2", cost_at_allocation: 500 },
    ],
    sessions: [
      { id: "s1", title_en: "One",   attendance_count: 12 },
      { id: "s2", title_en: "Two",   attendance_count: 8 },
      { id: "s3", title_en: "Three", attendance_count: null }, // ran, headcount not entered — counts as 0
      { id: "s4", title_en: "Four",  attendance_count: 999 },  // pending → excluded
    ],
  });

  const view = await buildTrackView(trackDonor);
  assert.equal(view.lifetime.people_reached, 20, "s1(12) + s2(8) + s3(null→0) — s4 pending excluded");
});

test("buildTrackView.lifetime.sessions_supported counts DISTINCT completed session_ids", async (t) => {
  // Same session appears twice — two of the donor's gifts landed on it.
  // §15 requires DISTINCT or the count silently inflates.
  stubTrackDeps(t, {
    allocs: [
      { session_id: "s1", status: "completed", donor_period_id: "p1", cost_at_allocation: 100 },
      { session_id: "s1", status: "completed", donor_period_id: "p1", cost_at_allocation: 100 },
      { session_id: "s2", status: "completed", donor_period_id: "p1", cost_at_allocation: 100 },
      { session_id: "s3", status: "pending", donor_period_id: "p2", cost_at_allocation: 100 },
      { session_id: "s4", status: "planned", donor_period_id: "p2", cost_at_allocation: 100 },
    ],
  });

  const view = await buildTrackView(trackDonor);

  assert.equal(view.lifetime.sessions_supported, 2, "s1 counts once, not twice");
  assert.equal(view.lifetime.sessions_on_the_way, 2, "s3 pending + s4 planned = 2 on the way");
});

test("buildTrackView.lifetime totals use succeeded donations only", async (t) => {
  stubTrackDeps(t, {
    donations: [
      { amount_hkd: 300, status: "succeeded", created_at: "2026-06-01T00:00:00Z" },
      { amount_hkd: 500, status: "succeeded", created_at: "2026-07-01T00:00:00Z" },
      { amount_hkd: 999, status: "failed", created_at: "2026-05-01T00:00:00Z" },
      { amount_hkd: 999, status: "refunded", created_at: "2026-05-15T00:00:00Z" },
    ],
  });

  const view = await buildTrackView(trackDonor);

  assert.equal(view.lifetime.total_given_hkd, 800, "failed/refunded never inflate");
  assert.equal(view.lifetime.donation_count, 2, "COUNT excludes failed/refunded");
  assert.equal(view.donor.supporter_since, "2026-06-01T00:00:00Z", "earliest succeeded");
});

test("buildTrackView.period exposes the requested period with PLAN.md §C1 fields", async (t) => {
  stubTrackDeps(t, {
    allocs: [
      { session_id: "s1", status: "planned", donor_period_id: "p1", cost_at_allocation: 100 },
      { session_id: "s2", status: "planned", donor_period_id: "p2", cost_at_allocation: 100 },
      { session_id: "s3", status: "pending", donor_period_id: "p2", cost_at_allocation: 100 },
    ],
    periods: [
      { id: "p1", period_start: "2026-07-15", period_end: "2026-07-31", status: "closed" },
      { id: "p2", period_start: "2026-08-15", period_end: "2026-08-31", status: "open" },
    ],
    sessions: [
      { id: "s2", title_en: "Floor curling", title_zh: "地壺球", starts_at: "2026-08-20T10:00:00Z",
        location_en: "San Po Kong", location_zh: "新蒲崗", status: "scheduled",
        attendance_count: null, photo_url: null },
      { id: "s3", title_en: "Nutrition workshop", title_zh: "營養工作坊",
        starts_at: "2026-08-22T10:00:00Z", location_en: "Wanchai", location_zh: "灣仔",
        status: "scheduled", attendance_count: null, photo_url: null },
    ],
  });

  const view = await buildTrackView(trackDonor, { periodId: "p2" });

  assert.equal(view.period.id, "p2");
  assert.equal(view.period.status, "open");
  assert.equal(view.period.is_current, true, "PLAN.md §C1 field — true when status='open'");
  assert.equal(typeof view.period.events_credited, "number");
  assert.equal(view.period.events_shown, 2);
  assert.equal(view.period.events.length, 2);
  assert.equal(view.allocations, undefined, "PLAN.md: 'there is no allocations key'");
});

test("period.events_credited counts gifts whose EDITION is this period, not gifts made inside it", async (t) => {
  // Regression test. Under the fixed calendar a gift on the 2nd is credited to the edition
  // covering 15–31 Aug, so its created_at is deliberately OUTSIDE its own period window.
  // The old filter asked "was this donation created between period_start and period_end?",
  // which is false for every gift in the 1st–15th bucket — so this field always read 0
  // while events_shown beside it read 5.
  stubTrackDeps(t, {
    donations: [
      { id: "d1", status: "succeeded", amount_hkd: 2500, events_credited: 5,
        created_at: "2026-08-02T05:36:26Z" },
    ],
    periods: [
      { id: "p1", period_start: "2026-08-15", period_end: "2026-08-31", status: "open" },
    ],
    allocs: [
      { session_id: "s1", donation_id: "d1", status: "pending", donor_period_id: "p1",
        cost_at_allocation: 500 },
    ],
    sessions: [
      { id: "s1", title_en: "Floor curling", starts_at: "2026-08-09T10:00:00Z",
        location_en: "San Po Kong", status: "scheduled", capacity: 12,
        attendance_count: null, photo_url: null },
    ],
  });

  const view = await buildTrackView(trackDonor);

  assert.equal(
    view.period.events_credited,
    5,
    "gift made 2 Aug belongs to the 15–31 Aug edition and credited 5",
  );
});

test("period.events_credited excludes gifts belonging to a different edition", async (t) => {
  // The single-donation case above cannot distinguish "filtered correctly" from "not
  // filtered at all" — both yield 5. This one can: a second gift made on 20 Aug maps to the
  // NEXT edition (31 Aug – 15 Sep), so the 15–31 Aug period must still report 5, not 8.
  stubTrackDeps(t, {
    donations: [
      { id: "d1", status: "succeeded", amount_hkd: 2500, events_credited: 5,
        created_at: "2026-08-02T05:36:26Z" }, // → edition 15–31 Aug
      { id: "d2", status: "succeeded", amount_hkd: 1500, events_credited: 3,
        created_at: "2026-08-20T09:00:00Z" }, // → edition 31 Aug – 15 Sep
    ],
    periods: [
      { id: "p1", period_start: "2026-08-15", period_end: "2026-08-31", status: "closed" },
      { id: "p2", period_start: "2026-08-31", period_end: "2026-09-15", status: "open" },
    ],
    allocs: [],
    sessions: [],
  });

  const first = await buildTrackView(trackDonor, { periodId: "p1" });
  assert.equal(first.period.events_credited, 5, "15–31 Aug edition: only the 2 Aug gift");

  const second = await buildTrackView(trackDonor, { periodId: "p2" });
  assert.equal(second.period.events_credited, 3, "31 Aug–15 Sep edition: only the 20 Aug gift");
});

test("period.events_credited sums multiple gifts landing in the same edition", async (t) => {
  // Two gifts in the same 1st–15th bucket both map to the 15–31 Aug edition, so the donor
  // is told 5 + 3 = 8 — independent of how many sessions were actually allocated.
  stubTrackDeps(t, {
    donations: [
      { id: "d1", status: "succeeded", amount_hkd: 2500, events_credited: 5,
        created_at: "2026-08-02T05:00:00Z" },
      { id: "d2", status: "succeeded", amount_hkd: 1500, events_credited: 3,
        created_at: "2026-08-11T09:00:00Z" },
    ],
    periods: [
      { id: "p1", period_start: "2026-08-15", period_end: "2026-08-31", status: "open" },
    ],
    allocs: [],
    sessions: [],
  });

  const view = await buildTrackView(trackDonor);

  assert.equal(view.period.events_credited, 8, "5 + 3, both in the 15–31 Aug edition");
  assert.equal(view.period.events_shown, 0, "credited is what was bought, not what was allocated");
});

test("period.events_credited ignores failed and refunded gifts", async (t) => {
  // CONTEXT.md §15: failed and refunded charges must never inflate a donor-facing figure.
  stubTrackDeps(t, {
    donations: [
      { id: "d1", status: "succeeded", amount_hkd: 2500, events_credited: 5,
        created_at: "2026-08-02T05:00:00Z" },
      { id: "d2", status: "failed", amount_hkd: 5000, events_credited: 10,
        created_at: "2026-08-03T05:00:00Z" },
      { id: "d3", status: "refunded", amount_hkd: 5000, events_credited: 10,
        created_at: "2026-08-04T05:00:00Z" },
    ],
    periods: [
      { id: "p1", period_start: "2026-08-15", period_end: "2026-08-31", status: "open" },
    ],
    allocs: [],
    sessions: [],
  });

  const view = await buildTrackView(trackDonor);

  assert.equal(view.period.events_credited, 5, "only the succeeded gift counts");
});

test("buildTrackView.period.events carry PLAN.md §C1 fields — kind, title, status from session", async (t) => {
  stubTrackDeps(t, {
    allocs: [
      { session_id: "s1", status: "pending", donor_period_id: "p1", cost_at_allocation: 100 },
    ],
    periods: [
      { id: "p1", period_start: "2026-08-15", period_end: "2026-08-31", status: "open" },
    ],
    sessions: [
      { id: "s1", title_en: "Floor curling", title_zh: "地壺球",
        starts_at: "2026-08-20T10:00:00Z",
        location_en: "San Po Kong", location_zh: "新蒲崗",
        status: "scheduled", capacity: 12, attendance_count: null, photo_url: null },
    ],
  });

  const view = await buildTrackView(trackDonor);
  const event = view.period.events[0];

  assert.equal(event.kind, "session", "PLAN.md §C1 — 'session' or 'opportunity'");
  assert.equal(event.id, "s1");
  assert.equal(event.title, "Floor curling", "title resolved via donor.locale='en'");
  assert.equal(event.location, "San Po Kong");
  assert.equal(event.starts_at, "2026-08-20T10:00:00Z");
  assert.equal(event.status, "scheduled", "session's own status — NOT allocation status");
  assert.equal(event.attendance_count, null, "null renders 'headcount pending', never 0");
  assert.equal(event.photo_url, null);
  // `sessions.capacity` stands in for expected_participants — the admin track owns that
  // table and is not adding a column for us. Planned headcount, distinct from
  // attendance_count above, which is who actually came.
  assert.equal(event.expected_participants, 12, "mapped from sessions.capacity");
  // Under PLAN.md there is no per-event `status: pending|planned` — do not leak it
  assert.equal(event.cost_at_allocation, undefined, "cost is internal, not exposed");
});

test("buildTrackView lists a session once even when several gifts landed on it", async (t) => {
  // Reproduces a real report: HK$500 (1 credit) then HK$1,450 (3 credits) in one window
  // produced 4 allocations across 3 distinct sessions, and "Family support circle" appeared
  // twice on the page. Two gifts collide whenever the second one's eligibility window
  // overlaps the first — the allocator picks soonest-first and does not exclude what an
  // earlier gift already funded, which is by design.
  //
  // `events` was built by mapping over ALLOCATIONS while the deduplicated `sessionIds` was
  // used only to fetch. A donor seeing the same class listed twice reads it as us
  // double-counting their money. The identical bug in the edition email was fixed earlier in
  // period-close.service.js; this is the same defect on the page.
  const period = {
    id: "p1",
    period_start: "2026-08-15",
    period_end: "2026-08-31",
    status: "open",
  };
  stubTrackDeps(t, {
    periods: [period],
    allocs: [
      { id: "a1", session_id: "s_family", donor_period_id: "p1", status: "pending" },
      { id: "a2", session_id: "s_family", donor_period_id: "p1", status: "pending" },
      { id: "a3", session_id: "s_moment10", donor_period_id: "p1", status: "pending" },
      { id: "a4", session_id: "s_moment11", donor_period_id: "p1", status: "pending" },
    ],
    sessions: [
      { id: "s_family", title_en: "Family support circle", starts_at: "2026-08-10T02:00:00Z" },
      { id: "s_moment10", title_en: "Community moment", starts_at: "2026-08-10T06:00:00Z" },
      { id: "s_moment11", title_en: "Community moment", starts_at: "2026-08-11T02:00:00Z" },
    ],
  });

  const view = await buildTrackView(trackDonor);

  assert.equal(view.period.events.length, 3, "4 allocations, 3 distinct sessions");
  assert.equal(view.period.events_shown, 3, "events_shown must agree with the list");

  const ids = view.period.events.map((e) => e.id);
  assert.deepEqual(new Set(ids).size, ids.length, "no session appears twice");
  assert.deepEqual(ids, ["s_family", "s_moment10", "s_moment11"], "still ordered by starts_at");
});

test("buildTrackView resolves title/location via donor.locale=zh-Hant", async (t) => {
  stubTrackDeps(t, {
    allocs: [
      { session_id: "s1", status: "pending", donor_period_id: "p1", cost_at_allocation: 100 },
    ],
    periods: [
      { id: "p1", period_start: "2026-08-15", period_end: "2026-08-31", status: "open" },
    ],
    sessions: [
      { id: "s1", title_en: "Floor curling", title_zh: "地壺球",
        starts_at: "2026-08-20T10:00:00Z",
        location_en: "San Po Kong", location_zh: "新蒲崗",
        status: "scheduled" },
    ],
  });

  const view = await buildTrackView({ ...trackDonor, locale: "zh-Hant" });
  const event = view.period.events[0];

  assert.equal(event.title, "地壺球", "zh-Hant preferred");
  assert.equal(event.location, "新蒲崗");
});

test("buildTrackView defaults to the currently-open period when no period_id supplied", async (t) => {
  stubTrackDeps(t, {
    allocs: [
      { session_id: "s1", status: "pending", donor_period_id: "p2", cost_at_allocation: 100 },
    ],
    periods: [
      { id: "p1", period_start: "2026-07-15", period_end: "2026-07-31", status: "closed" },
      { id: "p2", period_start: "2026-08-15", period_end: "2026-08-31", status: "open" },
    ],
    sessions: [
      { id: "s1", title_en: "Session 1", starts_at: "2026-08-20T10:00:00Z", status: "scheduled" },
    ],
  });

  const view = await buildTrackView(trackDonor);

  assert.equal(view.period.id, "p2");
  assert.equal(view.period.is_current, true);
});

test("buildTrackView.periods archive list — all periods newest first with labels", async (t) => {
  stubTrackDeps(t, {
    periods: [
      { id: "p2", period_start: "2026-08-15", period_end: "2026-08-31", status: "open" },
      { id: "p1", period_start: "2026-07-15", period_end: "2026-07-31", status: "closed" },
    ],
  });

  const view = await buildTrackView(trackDonor);

  assert.equal(view.periods.length, 2);
  assert.equal(view.periods[0].id, "p2", "newest first");
  assert.equal(view.periods[0].status, "open");
  assert.equal(typeof view.periods[0].label, "string");
  assert.ok(view.periods[0].label.length > 0, "human label present, e.g. '15 Aug – 30 Aug'");
});

test("buildTrackView tolerates a donor with no periods yet — period is null but strip populates", async (t) => {
  stubTrackDeps(t, {
    donations: [
      { amount_hkd: 300, status: "succeeded", created_at: "2026-08-01T00:00:00Z" },
    ],
  });

  const view = await buildTrackView(trackDonor);

  assert.equal(view.period, null);
  assert.deepEqual(view.periods, []);
  assert.equal(view.lifetime.total_given_hkd, 300, "strip still populates from donations");
  assert.equal(view.lifetime.donation_count, 1);
});
