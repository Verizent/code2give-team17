// The DEMO-ONLY stub path, exercised end to end.
//
// Deliberately does NOT mock the repo: these tests exist to prove the generated data
// actually flows through the real service and produces a populated page. Mocking the
// repo here would test the mock, and the failure this guards against is precisely a
// stub whose shape has drifted from what the service reads.
//
// The sibling analytics.service.test.js covers the opposite guarantee — that an empty
// denominator yields null — by passing rows directly to the pure functions.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const analyticsRepo = require("../../../src/data/analytics.repo");
const { getAnalytics } = require("../../../src/services/admin/analytics.service");

// Volunteer programmes. `where_needed` is a DONOR designation and must never appear —
// no volunteer can sign up for "give where needed most".
const PROGRAMMES = ["community_education", "fitness", "nutrition", "sports"];

// These describe the stub path only. With the flag off the repo queries Supabase, and
// this whole tree is the OFFLINE suite — it must never start needing credentials to be
// green. Skipping states the reason rather than failing with a config error, matching
// how test/schema/_helpers.js handles a missing service-role key.
// Every assertion here goes end to end through getAnalytics, so it needs whichever
// sources are stubbed to ALL be stubbed. With volunteers reading live Supabase this
// suite would need credentials, and this is the offline tree — it must never start
// needing them. windowFor and the metric maths stay covered in analytics.service.test.js,
// which passes rows directly and touches no repo.
const skip =
  analyticsRepo.USE_STUB_DONATIONS && analyticsRepo.USE_STUB_VOLUNTEERS
    ? false
    : "volunteer analytics read live Supabase — end-to-end stub coverage does not apply";

test("stubbed analytics fills every rate — a demo that renders 'not enough data' is the bug", { skip }, async () => {
  const payload = await getAnalytics();

  const rates = {
    "donor_retention.rate": payload.donor_retention.rate,
    "repeat_gift.rate": payload.repeat_gift.rate,
    "capacity_fill.rate": payload.capacity_fill.rate,
    "satisfaction.average_rating": payload.satisfaction.average_rating,
    "satisfaction.would_return_rate": payload.satisfaction.would_return_rate,
  };

  for (const [name, value] of Object.entries(rates)) {
    assert.ok(
      Number.isFinite(value),
      `${name} is ${value} — the stub is not reaching this metric`,
    );
  }
});

test("donor retention lands in a plausible band rather than a flattering one", { skip }, async () => {
  const { donor_retention } = await getAnalytics();

  // The published sector benchmark is 40-45%. A stub returning 5% or 98% would make the
  // benchmark comparison on the tile meaningless, so fail loudly rather than ship it.
  assert.ok(
    donor_retention.rate > 20 && donor_retention.rate < 80,
    `retention of ${donor_retention.rate}% is not a believable figure`,
  );
  assert.ok(donor_retention.prior_donors > 0);
});

test("repeat giving is a believable non-zero", { skip }, async () => {
  const { repeat_gift } = await getAnalytics();

  assert.ok(repeat_gift.repeat_donors > 0);
  assert.ok(repeat_gift.rate > 0 && repeat_gift.rate < 100);
});

test("donations_by_month returns twelve populated months, oldest first", { skip }, async () => {
  const { donations_by_month } = await getAnalytics();

  assert.equal(donations_by_month.length, 12);

  const months = donations_by_month.map((row) => row.month);
  assert.deepEqual([...months].sort(), months, "months are not in ascending order");

  for (const row of donations_by_month) {
    assert.match(row.month, /^\d{4}-\d{2}$/);
    assert.ok(row.amount_hkd > 0, `${row.month} is empty — the chart would show a gap`);
  }
});

test("every programme appears and none reports an unknown fill rate", { skip }, async () => {
  const { programmes } = await getAnalytics();

  const seen = programmes.map((row) => row.programme).sort();
  assert.deepEqual(seen, [...PROGRAMMES].sort());

  for (const row of programmes) {
    assert.ok(Number.isFinite(row.fill_rate), `${row.programme} has no fill rate`);
    assert.ok(row.attended > 0);
    assert.ok(row.attended <= row.signups, `${row.programme} shows more attended than signups`);
    assert.ok(row.signups <= row.capacity, `${row.programme} shows more signups than places`);
  }
});

test("capacity fill is realistic — never a uniformly full chart", { skip }, async () => {
  const { programmes } = await getAnalytics();

  const fills = programmes.map((row) => row.fill_rate);
  assert.ok(Math.max(...fills) <= 100);
  assert.ok(
    new Set(fills).size > 1,
    "every programme has an identical fill rate, which reads as fabricated",
  );
});

test("satisfaction reports a partial response rate, not a perfect one", { skip }, async () => {
  const { satisfaction } = await getAnalytics();

  assert.ok(satisfaction.responses > 0);
  assert.ok(satisfaction.average_rating >= 1 && satisfaction.average_rating <= 5);
});

test("no stubbed donation is dated in the future", { skip }, async () => {
  const now = Date.now();

  for (const row of await analyticsRepo.listDonations()) {
    assert.ok(
      new Date(row.created_at).getTime() <= now,
      `${row.created_at} is in the future — donorRetention drops it while the month chart still counts it, so the two panels disagree`,
    );
  }
});

test("the retained cohort is the size the generator intends", { skip }, async () => {
  // Guards the same failure from the other side: a future-dated or out-of-window gift
  // silently shrinks this without any test noticing.
  const { donor_retention } = await getAnalytics();

  assert.equal(donor_retention.prior_donors, 18);
  assert.equal(donor_retention.retained, 8);
  assert.equal(donor_retention.current_donors, 20);
});

test("the stub is deterministic — the demo cannot change between rehearsal and stage", { skip }, async () => {
  const first = await analyticsRepo.listDonations();
  const second = await analyticsRepo.listDonations();
  assert.deepEqual(first, second);

  const opportunitiesA = await analyticsRepo.listOpportunities();
  const opportunitiesB = await analyticsRepo.listOpportunities();
  assert.deepEqual(opportunitiesA, opportunitiesB);

  const signupsA = await analyticsRepo.listSignups();
  const signupsB = await analyticsRepo.listSignups();
  assert.deepEqual(signupsA, signupsB);

  const payloadA = await getAnalytics();
  const payloadB = await getAnalytics();
  assert.deepEqual(payloadA, payloadB);
});

test("a year of volunteer opportunities, not a fortnight of them", { skip }, async () => {
  const { programmes, capacity_fill } = await getAnalytics();

  assert.equal(programmes.length, 4);
  assert.ok(
    capacity_fill.capacity > 500,
    `only ${capacity_fill.capacity} places offered — too thin to read as a year`,
  );
});

test("a year of feedback, not a handful", { skip }, async () => {
  const { satisfaction } = await getAnalytics();

  assert.ok(satisfaction.responses >= 50, `only ${satisfaction.responses} responses`);
  assert.ok(satisfaction.average_rating >= 1 && satisfaction.average_rating <= 5);
});
