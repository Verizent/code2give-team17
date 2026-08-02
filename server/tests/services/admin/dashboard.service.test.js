const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const donationsRepo = require("../../../src/data/donations.repo");
const opportunitiesRepo = require("../../../src/data/opportunities.repo");
const interestsRepo = require("../../../src/data/interests.repo");
const signupsRepo = require("../../../src/data/signups.repo");
const campaignsRepo = require("../../../src/data/campaigns.repo");
const communityPostsRepo = require("../../../src/data/community-posts.repo");
const impactRepo = require("../../../src/data/impact.repo");
const {
  getDashboard,
  lastNMonths,
  lastSixMonths,
  fillMonthSeries,
} = require("../../../src/services/admin/dashboard.service");

/** Routes the admin shell actually mounts — anything else in the queue is a dead link. */
const LIVE_ADMIN_ROUTES = ["/admin", "/admin/articles", "/admin/campaigns", "/admin/moderation", "/admin/analytics", "/"];

function stubDashboardRepos() {
  mock.method(donationsRepo, "sumAmounts", async () => ({ total_hkd: 3510, count: 3 }));
  mock.method(donationsRepo, "sumByMonth", async () => []);
  mock.method(opportunitiesRepo, "summariseOpen", async () => ({ upcoming: 8, spots_open: 29 }));
  mock.method(interestsRepo, "countAll", async () => 4);
  mock.method(signupsRepo, "hoursByMonth", async () => []);
  mock.method(campaignsRepo, "list", async () => ({ rows: [], total: 2 }));
  mock.method(communityPostsRepo, "countByStatus", async () => 5);
  mock.method(impactRepo, "findCurrent", async () => ({ id: "period-1" }));
}

test("dashboard queue never links to a removed admin tab", async (t) => {
  stubDashboardRepos();
  t.after(() => mock.restoreAll());

  const { queue } = await getDashboard();

  for (const item of queue) {
    assert.ok(
      LIVE_ADMIN_ROUTES.includes(item.href),
      `queue item "${item.id}" points at ${item.href}, which is not a mounted route`,
    );
  }
});

test("dashboard metrics no longer report pending_proofs", async (t) => {
  stubDashboardRepos();
  t.after(() => mock.restoreAll());

  const { metrics } = await getDashboard();

  assert.ok(!("pending_proofs" in metrics));
});

test("lastNMonths returns N ascending keys ending at the given month", () => {
  const keys = lastNMonths(12, new Date("2026-08-02T12:00:00Z"));
  assert.equal(keys.length, 12);
  assert.equal(keys[0], "2025-09");
  assert.equal(keys[11], "2026-08");
  assert.deepEqual([...keys].sort(), keys);
});

test("lastNMonths crosses a year boundary without drifting", () => {
  // February is where naive month arithmetic breaks: subtracting 11 months has to
  // roll the year back, not clamp the day.
  const keys = lastNMonths(12, new Date("2026-02-01T00:00:00Z"));
  assert.equal(keys[0], "2025-03");
  assert.equal(keys[11], "2026-02");
});

test("lastNMonths handles a single month", () => {
  assert.deepEqual(lastNMonths(1, new Date("2026-08-02T12:00:00Z")), ["2026-08"]);
});

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
