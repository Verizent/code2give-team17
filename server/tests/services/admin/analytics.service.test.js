const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const analyticsRepo = require("../../../src/data/analytics.repo");
const {
  getAnalytics,
  rate,
  donorRetention,
  repeatGiftRate,
  capacityFill,
  satisfaction,
  popularProgrammes,
  acquisitionSource,
} = require("../../../src/services/admin/analytics.service");

const NOW = new Date("2026-08-02T00:00:00Z");

/** `n` months before NOW, as an ISO string. */
function monthsAgo(n) {
  const d = new Date(NOW);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString();
}

function gift(donor_id, months, extra = {}) {
  return {
    donor_id,
    amount_hkd: 500,
    status: "succeeded",
    created_at: monthsAgo(months),
    frequency: "once",
    ...extra,
  };
}

// ── The zero-denominator guard ────────────────────────────────────────────────
// Every metric on this page is a ratio. Returning 0 for an empty denominator is
// not a rounding detail: "0% attended" is a false claim about the charity, where
// the truth is "nothing has been recorded". These are the tests that matter most.

test("rate returns null — not 0, not NaN — when the denominator is zero", () => {
  assert.equal(rate(0, 0), null);
  assert.equal(rate(5, 0), null);
});

test("rate never returns NaN or Infinity for any degenerate input", () => {
  for (const [n, d] of [
    [0, 0],
    [1, 0],
    [0, null],
    [0, undefined],
    [1, -1],
  ]) {
    const result = rate(n, d);
    assert.ok(
      result === null || Number.isFinite(result),
      `rate(${n}, ${d}) returned ${result}`,
    );
  }
});

test("rate returns a percentage rounded to one decimal place", () => {
  assert.equal(rate(1, 3), 33.3);
  assert.equal(rate(2, 3), 66.7);
  assert.equal(rate(1, 1), 100);
});

// ── Donor retention ───────────────────────────────────────────────────────────

test("donorRetention is null when nobody gave in the prior window", () => {
  const result = donorRetention([gift("d1", 1), gift("d2", 2)], NOW);
  assert.equal(result.prior_donors, 0);
  assert.equal(result.rate, null);
});

test("donorRetention counts only donors present in BOTH windows", () => {
  const rows = [
    gift("kept", 18), // prior window
    gift("kept", 2), // and current — retained
    gift("lapsed", 20), // prior only
    gift("new", 1), // current only — not retained, not in denominator
  ];
  const result = donorRetention(rows, NOW);
  assert.equal(result.prior_donors, 2);
  assert.equal(result.retained, 1);
  assert.equal(result.rate, 50);
});

test("donorRetention ignores donations that never succeeded", () => {
  const rows = [
    gift("d1", 18),
    gift("d1", 2, { status: "pending" }), // must not count as a return
  ];
  const result = donorRetention(rows, NOW);
  assert.equal(result.retained, 0);
  assert.equal(result.rate, 0);
});

test("donorRetention excludes gifts older than the prior window", () => {
  const result = donorRetention([gift("ancient", 40)], NOW);
  assert.equal(result.prior_donors, 0);
  assert.equal(result.rate, null);
});

// ── Repeat giving ─────────────────────────────────────────────────────────────

test("repeatGiftRate is null when there are no donors at all", () => {
  const result = repeatGiftRate([]);
  assert.equal(result.total_donors, 0);
  assert.equal(result.rate, null);
});

test("repeatGiftRate counts donors with two or more succeeded gifts", () => {
  const rows = [gift("a", 1), gift("a", 2), gift("b", 1), gift("c", 3), gift("c", 4)];
  const result = repeatGiftRate(rows);
  assert.equal(result.total_donors, 3);
  assert.equal(result.repeat_donors, 2);
  assert.equal(result.rate, 66.7);
});

test("repeatGiftRate does not let a pending gift create a repeat donor", () => {
  const rows = [gift("a", 1), gift("a", 2, { status: "pending" })];
  const result = repeatGiftRate(rows);
  assert.equal(result.repeat_donors, 0);
});

// ── Capacity fill ─────────────────────────────────────────────────────────────

test("capacityFill is null when no opportunity offers any places", () => {
  const result = capacityFill([{ id: "o1", programme: "sports", capacity: 0 }], []);
  assert.equal(result.rate, null);
});

test("capacityFill is null — not zero — when signups exist but none is marked attended", () => {
  // The live state: signups recorded, attended_at never written.
  const result = capacityFill(
    [{ id: "o1", programme: "sports", capacity: 20 }],
    [{ opportunity_id: "o1", attended_at: null }],
  );
  assert.equal(result.attended, 0);
  assert.equal(result.rate, null);
});

test("capacityFill counts attended signups against opportunity capacity", () => {
  const result = capacityFill(
    [
      { id: "o1", programme: "sports", capacity: 20 },
      { id: "o2", programme: "fitness", capacity: 30 },
    ],
    [
      { opportunity_id: "o1", attended_at: "2026-07-01T00:00:00Z" },
      { opportunity_id: "o2", attended_at: "2026-07-01T00:00:00Z" },
      { opportunity_id: "o2", attended_at: null },
    ],
  );
  assert.equal(result.capacity, 50);
  assert.equal(result.attended, 2);
  assert.equal(result.rate, 4);
});

// ── Satisfaction ──────────────────────────────────────────────────────────────

test("satisfaction is null on every field when nobody left feedback", () => {
  const result = satisfaction([{ experience_rating: null, would_return: null, feedback_submitted_at: null }]);
  assert.equal(result.responses, 0);
  assert.equal(result.average_rating, null);
  assert.equal(result.would_return_rate, null);
});

test("satisfaction averages only rows that actually submitted feedback", () => {
  const rows = [
    { experience_rating: 5, would_return: true, feedback_submitted_at: monthsAgo(1) },
    { experience_rating: 3, would_return: false, feedback_submitted_at: monthsAgo(2) },
    { experience_rating: 1, would_return: true, feedback_submitted_at: null }, // ignored
  ];
  const result = satisfaction(rows);
  assert.equal(result.responses, 2);
  assert.equal(result.average_rating, 4);
  assert.equal(result.would_return_rate, 50);
});

// ── Programme demand ──────────────────────────────────────────────────────────

test("popularProgrammes groups by programme and sorts by attendance", () => {
  const result = popularProgrammes(
    [
      { id: "o1", programme: "sports", capacity: 10 },
      { id: "o2", programme: "sports", capacity: 10 },
      { id: "o3", programme: "nutrition", capacity: 5 },
    ],
    [
      { opportunity_id: "o1", attended_at: "2026-07-01T00:00:00Z" },
      { opportunity_id: "o2", attended_at: "2026-07-01T00:00:00Z" },
      { opportunity_id: "o3", attended_at: "2026-07-01T00:00:00Z" },
      { opportunity_id: "o1", attended_at: null },
    ],
  );

  assert.equal(result.length, 2);
  assert.equal(result[0].programme, "sports");
  assert.equal(result[0].capacity, 20);
  assert.equal(result[0].signups, 3);
  assert.equal(result[0].attended, 2);
  assert.equal(result[1].programme, "nutrition");
});

test("popularProgrammes gives a programme with no capacity a null fill rate", () => {
  const result = popularProgrammes([{ id: "o1", programme: "fitness", capacity: 0 }], []);
  assert.equal(result[0].fill_rate, null);
});

test("popularProgrammes skips opportunities with no programme rather than inventing a bucket", () => {
  const result = popularProgrammes(
    [
      { id: "o1", programme: null, capacity: 10 },
      { id: "o2", programme: "sports", capacity: 10 },
    ],
    [],
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].programme, "sports");
});

test("popularProgrammes ignores a signup whose opportunity is outside the window", () => {
  const result = popularProgrammes(
    [{ id: "o1", programme: "sports", capacity: 10 }],
    [
      { opportunity_id: "o1", attended_at: "2026-07-01T00:00:00Z" },
      { opportunity_id: "gone", attended_at: "2026-07-01T00:00:00Z" },
    ],
  );
  assert.equal(result[0].signups, 1);
});

// ── Acquisition source ────────────────────────────────────────────────────────

test("acquisitionSource counts each source and buckets missing answers as unknown", () => {
  const result = acquisitionSource({
    donors: [{ source: "instagram" }, { source: "instagram" }, { source: null }],
    volunteers: [{ source: "friend" }],
  });
  assert.deepEqual(result.donors, [
    { source: "instagram", count: 2 },
    { source: "unknown", count: 1 },
  ]);
  assert.deepEqual(result.volunteers, [{ source: "friend", count: 1 }]);
});

test("acquisitionSource returns empty lists rather than throwing on no rows", () => {
  const result = acquisitionSource({ donors: [], volunteers: [] });
  assert.deepEqual(result.donors, []);
  assert.deepEqual(result.volunteers, []);
});

// ── Composition ───────────────────────────────────────────────────────────────

test("getAnalytics composes every metric and never returns NaN over the wire", async (t) => {
  mock.method(analyticsRepo, "listDonations", async () => [gift("a", 1), gift("a", 14)]);
  mock.method(analyticsRepo, "listOpportunities", async () => [
    { id: "o1", programme: "sports", capacity: 10, starts_at: monthsAgo(1) },
  ]);
  mock.method(analyticsRepo, "listSignups", async () => [
    { opportunity_id: "o1", attended_at: monthsAgo(1), created_at: monthsAgo(1) },
  ]);
  mock.method(analyticsRepo, "listSignupFeedback", async () => []);
  mock.method(analyticsRepo, "listAcquisitionSources", async () => ({
    donors: [],
    volunteers: [],
    available: false,
  }));
  t.after(() => mock.restoreAll());

  const payload = await getAnalytics();

  // JSON.stringify turns NaN into null silently — assert on the round trip, which is
  // what the client actually receives.
  assert.ok(!JSON.stringify(payload).includes("NaN"));
  assert.equal(payload.capacity_fill.rate, 10);
  assert.equal(payload.satisfaction.average_rating, null);
  assert.equal(payload.acquisition.available, false);
});
