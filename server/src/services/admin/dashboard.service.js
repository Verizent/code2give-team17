const donationsRepo = require("../../data/donations.repo");
const campaignsRepo = require("../../data/campaigns.repo");
const opportunitiesRepo = require("../../data/opportunities.repo");
const interestsRepo = require("../../data/interests.repo");
const signupsRepo = require("../../data/signups.repo");
const communityPostsRepo = require("../../data/community-posts.repo");
const impactRepo = require("../../data/impact.repo");

/**
 * Last `count` calendar month keys ending at `now` (UTC), oldest first.
 *
 * `Date.UTC` is given a negative month index rather than the month being decremented in
 * place — that is what rolls the year back correctly at a January boundary.
 *
 * @param {number} count
 * @param {Date} [now]
 * @returns {string[]}
 */
function lastNMonths(count, now = new Date()) {
  const keys = [];
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  for (let i = count - 1; i >= 0; i -= 1) {
    keys.push(new Date(Date.UTC(year, month - i, 1)).toISOString().slice(0, 7));
  }

  return keys;
}

/**
 * Last six calendar month keys ending at `now` (UTC), oldest first.
 *
 * @param {Date} [now]
 * @returns {string[]}
 */
function lastSixMonths(now = new Date()) {
  return lastNMonths(6, now);
}

/**
 * Align live monthly rows to a fixed month window; missing months are zero.
 *
 * @template {{ month: string }} T
 * @param {T[]} live
 * @param {string[]} months
 * @param {(row: T | undefined, month: string) => T} fill
 * @returns {T[]}
 */
function fillMonthSeries(live, months, fill) {
  const liveMap = new Map(live.map((row) => [row.month, row]));
  return months.map((month) => fill(liveMap.get(month), month));
}

/**
 * Admin dashboard payload: metrics → charts → derived work queue (§23).
 * Aggregates are live DB counts only — empty windows stay zero, never seeded.
 */
async function getDashboard() {
  const money = await donationsRepo.sumAmounts();
  const volunteerSummary = await opportunitiesRepo.summariseOpen();
  const interests_count = await interestsRepo.countAll();

  const pendingCampaigns = await campaignsRepo.list({
    from: 0,
    to: 0,
    status: "pending_approval",
  });

  let pending_voices = 0;
  let voicesAvailable = true;
  try {
    pending_voices = await communityPostsRepo.countByStatus("pending");
  } catch {
    voicesAvailable = false;
    pending_voices = 0;
  }

  let impact_current = false;
  let impact_available = true;
  try {
    const current = await impactRepo.findCurrent();
    impact_current = Boolean(current);
  } catch {
    impact_available = false;
    impact_current = false;
  }

  const months = lastSixMonths();
  const liveDonations = await donationsRepo.sumByMonth();
  const liveHours = await signupsRepo.hoursByMonth();

  const donations_by_month = fillMonthSeries(
    liveDonations,
    months,
    (row, month) => ({ month, amount_hkd: Number(row?.amount_hkd) || 0 }),
  );
  const volunteer_hours_by_month = fillMonthSeries(
    liveHours,
    months,
    (row, month) => ({ month, hours: Number(row?.hours) || 0 }),
  );

  /** @type {Array<{ id: string, title: string, detail: string, count: number | null, href: string }>} */
  const queue = [];

  // The Story desk and Class roll queue items lived here. Both tabs were removed, so
  // every one of them pointed at a route that no longer exists — a queue whose first
  // item 404s is worse than a shorter queue.

  if (pendingCampaigns.total > 0) {
    queue.push({
      id: "campaigns",
      title: "Fundraisers awaiting approval",
      detail: "Review story and goal before the campaign appears on Give.",
      count: pendingCampaigns.total,
      href: "/admin/campaigns",
    });
  }

  if (voicesAvailable && pending_voices > 0) {
    queue.push({
      id: "voices",
      title: "Voices review",
      detail: "Approve or reject supporter stories before they appear on News.",
      count: pending_voices,
      href: "/admin/moderation",
    });
  }

  if (!impact_current) {
    queue.push({
      id: "impact",
      title: impact_available ? "Impact period missing" : "Impact figures unavailable",
      detail: impact_available
        ? "Home credibility strip needs a current impact_periods row (annual report figures)."
        : "Could not read impact_periods — check service-role grants or run the content seed.",
      count: null,
      href: "/",
    });
  }

  return {
    metrics: {
      donations_total_hkd: money.total_hkd,
      donations_count: money.count,
      volunteer_sessions_upcoming: volunteerSummary.upcoming,
      volunteer_spots_open: volunteerSummary.spots_open,
      interests_count,
      pending_campaigns: pendingCampaigns.total,
      pending_voices,
      voices_available: voicesAvailable,
      impact_current,
    },
    charts: {
      donations_by_month,
      volunteer_hours_by_month,
    },
    queue,
  };
}

module.exports = {
  getDashboard,
  lastNMonths,
  lastSixMonths,
  fillMonthSeries,
};
