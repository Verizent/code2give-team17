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
 * buildTrackView — the §15 tracking page composer.
 * Lifetime strip fields are computed on read, never stored as counters (§15).
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
  assert.equal(view.lifetime.on_the_way, 0);
  assert.equal(view.lifetime.total_given, 0);
  assert.equal(view.lifetime.supporter_since, null);
});

test("buildTrackView sessions_supported counts DISTINCT completed session_ids", async (t) => {
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
  assert.equal(view.lifetime.on_the_way, 2, "s3 pending + s4 planned = 2 on the way");
});

test("buildTrackView total_given uses succeeded amounts only, supporter_since is the earliest", async (t) => {
  stubTrackDeps(t, {
    donations: [
      { amount_hkd: 300, status: "succeeded", created_at: "2026-06-01T00:00:00Z" },
      { amount_hkd: 500, status: "succeeded", created_at: "2026-07-01T00:00:00Z" },
    ],
  });

  const view = await buildTrackView(trackDonor);

  assert.equal(view.lifetime.total_given, 800);
  assert.equal(view.lifetime.supporter_since, "2026-06-01T00:00:00Z");
});

test("buildTrackView returns the requested edition when period_id is supplied", async (t) => {
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
      { id: "s2", title_en: "Session 2", starts_at: "2026-08-20T10:00:00Z", status: "scheduled" },
      { id: "s3", title_en: "Session 3", starts_at: "2026-08-22T10:00:00Z", status: "scheduled" },
    ],
  });

  const view = await buildTrackView(trackDonor, { periodId: "p2" });

  assert.equal(view.edition.id, "p2");
  assert.equal(view.edition.status, "open");
  assert.equal(view.allocations.length, 2, "only p2's allocations");
  assert.deepEqual(
    view.allocations.map((a) => a.session.id).sort(),
    ["s2", "s3"],
  );
});

test("buildTrackView defaults to the most recent period when no period_id is supplied", async (t) => {
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

  assert.equal(view.edition.id, "p2");
});

test("buildTrackView tolerates a donor with no editions yet — edition is null", async (t) => {
  stubTrackDeps(t, {
    donations: [
      { amount_hkd: 300, status: "succeeded", created_at: "2026-08-01T00:00:00Z" },
    ],
  });

  const view = await buildTrackView(trackDonor);

  assert.equal(view.edition, null);
  assert.deepEqual(view.allocations, []);
  assert.equal(view.lifetime.total_given, 300, "strip still populates from donations");
});
