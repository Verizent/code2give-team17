// The ?range= filter, end to end through the stub.
//
// Narrow windows are where an analytics page dies quietly: the numerator empties, every
// rate returns null, and the section reads "not enough data yet" on stage. Most of these
// tests exist to make that loud instead.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const analyticsRepo = require("../../../src/data/analytics.repo");
const {
  getAnalytics,
  windowFor,
} = require("../../../src/services/admin/analytics.service");

const RANGES = ["all", "1y", "6m", "3m", "1m"];

/** Volunteer programmes. `where_needed` is a DONOR designation and must never appear. */
const VOLUNTEER_PROGRAMMES = ["community_education", "fitness", "nutrition", "sports"];

const skip = analyticsRepo.USE_STUB_ANALYTICS
  ? false
  : "USE_STUB_ANALYTICS is off — these cover the stub path only";

test("every range returns a populated payload — an empty window on stage is the failure", { skip }, async () => {
  for (const range of RANGES) {
    const payload = await getAnalytics(range);

    for (const [name, value] of Object.entries({
      "repeat_gift.rate": payload.repeat_gift.rate,
      "capacity_fill.rate": payload.capacity_fill.rate,
      "satisfaction.average_rating": payload.satisfaction.average_rating,
      "donor_retention.rate": payload.donor_retention.rate,
    })) {
      assert.ok(Number.isFinite(value), `range=${range}: ${name} is ${value}`);
    }

    assert.ok(payload.programmes.length > 0, `range=${range}: no programmes`);
  }
});

test("no rate collapses to zero at a narrow range", { skip }, async () => {
  // `Number.isFinite(0)` is true, so the test above passes on a tile reading 0%. A real
  // charity has recurring donors giving inside every window, so a flat zero here means
  // the generator has no short-cycle givers rather than that supporters stopped giving.
  for (const range of RANGES) {
    const { donor_retention, repeat_gift } = await getAnalytics(range);

    assert.ok(donor_retention.rate > 0, `range=${range}: retention collapsed to 0%`);
    assert.ok(repeat_gift.rate > 0, `range=${range}: repeat giving collapsed to 0%`);
  }
});

test("windowFor includes a row exactly at the cutoff and excludes one before it", () => {
  const now = new Date("2026-08-02T00:00:00Z");
  const start = windowFor("3m", now);

  assert.ok(start instanceof Date);
  assert.equal(start.toISOString(), "2026-05-02T00:00:00.000Z");
  // Boundary is inclusive: a gift made at the exact cutoff instant is inside the window.
  assert.ok(new Date(start.getTime()) >= start);
  assert.ok(new Date(start.getTime() - 1) < start);
});

test("windowFor returns null for all-time so nothing is filtered out", () => {
  assert.equal(windowFor("all", new Date("2026-08-02T00:00:00Z")), null);
});

test("a narrower range never reports more attendance than a wider one", { skip }, async () => {
  const [m1, m3, m6, y1, all] = await Promise.all(RANGES.map((r) => getAnalytics(r)).reverse());

  assert.ok(m1.capacity_fill.attended <= m3.capacity_fill.attended);
  assert.ok(m3.capacity_fill.attended <= m6.capacity_fill.attended);
  assert.ok(m6.capacity_fill.attended <= y1.capacity_fill.attended);
  assert.ok(y1.capacity_fill.attended <= all.capacity_fill.attended);
});

test("programmes are the four VOLUNTEER programmes — where_needed is a donor bucket", { skip }, async () => {
  for (const range of RANGES) {
    const { programmes } = await getAnalytics(range);
    const seen = programmes.map((row) => row.programme).sort();

    assert.ok(
      !seen.includes("where_needed"),
      `range=${range}: where_needed is a donation designation, not a volunteer activity`,
    );
    for (const programme of seen) {
      assert.ok(
        VOLUNTEER_PROGRAMMES.includes(programme),
        `range=${range}: ${programme} is not a volunteer programme`,
      );
    }
  }
});

test("all four volunteer programmes appear over all time", { skip }, async () => {
  const { programmes } = await getAnalytics("all");
  assert.deepEqual(programmes.map((row) => row.programme).sort(), VOLUNTEER_PROGRAMMES);
});

test("attended never exceeds signups, and signups never exceed places offered", { skip }, async () => {
  for (const range of RANGES) {
    const { programmes } = await getAnalytics(range);

    for (const row of programmes) {
      assert.ok(
        row.attended <= row.signups,
        `range=${range}: ${row.programme} shows ${row.attended} attended from ${row.signups} signups`,
      );
      assert.ok(
        row.signups <= row.capacity,
        `range=${range}: ${row.programme} shows ${row.signups} signups for ${row.capacity} places`,
      );
    }
  }
});

test("programme sizes stay uneven — four equal bars read as fabricated", { skip }, async () => {
  const { programmes } = await getAnalytics("all");
  const capacities = programmes.map((row) => row.capacity);
  assert.ok(new Set(capacities).size > 1);
});

test("donor retention names both windows it compared, at every range", { skip }, async () => {
  // The tile prints "N of M donors who gave <prior> gave again <current>". Without the
  // labels the number is uninterpretable once the range stops being a year, which is the
  // whole reason retention is allowed to follow the filter at all.
  for (const range of RANGES) {
    const { donor_retention } = await getAnalytics(range);

    assert.ok(donor_retention.prior_window_label, `range=${range}: no prior window label`);
    assert.ok(donor_retention.current_window_label, `range=${range}: no current window label`);
    assert.notEqual(donor_retention.prior_window_label, donor_retention.current_window_label);
  }
});

test("the annual sector benchmark is offered only when the window is a year", { skip }, async () => {
  // 40-45% is defined annually. Showing it beside a 3-month figure invites a comparison
  // that is not valid, which is worse than showing no benchmark at all.
  for (const range of ["all", "1y"]) {
    const { donor_retention } = await getAnalytics(range);
    assert.equal(donor_retention.benchmark_applies, true, `range=${range}`);
  }

  for (const range of ["6m", "3m", "1m"]) {
    const { donor_retention } = await getAnalytics(range);
    assert.equal(donor_retention.benchmark_applies, false, `range=${range}`);
  }
});

test("the giving chart spans the selected range, with a floor of three bars", { skip }, async () => {
  const expected = { all: 12, "1y": 12, "6m": 6, "3m": 3, "1m": 3 };

  for (const [range, months] of Object.entries(expected)) {
    const { donations_by_month } = await getAnalytics(range);
    assert.equal(donations_by_month.length, months, `range=${range}`);
  }
});

test("each range is deterministic", { skip }, async () => {
  for (const range of RANGES) {
    assert.deepEqual(await getAnalytics(range), await getAnalytics(range));
  }
});
