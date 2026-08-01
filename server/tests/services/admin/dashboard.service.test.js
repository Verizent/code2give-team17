const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  lastSixMonths,
  fillMonthSeries,
} = require("../../../src/services/admin/dashboard.service");

test("lastSixMonths returns six YYYY-MM keys ending at now", () => {
  const keys = lastSixMonths(new Date("2026-08-01T12:00:00Z"));
  assert.equal(keys.length, 6);
  assert.equal(keys[keys.length - 1], "2026-08");
  assert.equal(keys[0], "2026-03");
});

test("fillMonthSeries zero-fills missing months — never invents amounts", () => {
  const months = lastSixMonths(new Date("2026-08-01T12:00:00Z"));
  const series = fillMonthSeries(
    [{ month: months[months.length - 1], amount_hkd: 100 }],
    months,
    (row, month) => ({ month, amount_hkd: row?.amount_hkd ?? 0 }),
  );
  assert.equal(series.length, 6);
  assert.equal(series[series.length - 1].amount_hkd, 100);
  assert.equal(
    series.filter((row) => row.amount_hkd === 0).length,
    5,
  );
});

test("fillMonthSeries keeps live values across the window", () => {
  const months = lastSixMonths(new Date("2026-08-01T12:00:00Z"));
  const live = months.map((month, i) => ({ month, amount_hkd: (i + 1) * 1000 }));
  const series = fillMonthSeries(
    live,
    months,
    (row, month) => ({ month, amount_hkd: row?.amount_hkd ?? 0 }),
  );
  assert.equal(series[0].amount_hkd, 1000);
  assert.equal(series[5].amount_hkd, 6000);
});
