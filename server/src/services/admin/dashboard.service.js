const donationsRepo = require("../../data/donations.repo");
const campaignsRepo = require("../../data/campaigns.repo");
const opportunitiesRepo = require("../../data/opportunities.repo");
const interestsRepo = require("../../data/interests.repo");
const signupsRepo = require("../../data/signups.repo");
const communityPostsRepo = require("../../data/community-posts.repo");
const impactRepo = require("../../data/impact.repo");

/**
 * Last six calendar month keys ending at `now` (UTC), oldest first.
 *
 * @param {Date} [now]
 * @returns {string[]}
 */
function lastSixMonths(now = new Date()) {
  const keys = [];
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - i, 1));
    keys.push(d.toISOString().slice(0, 7));
  }
  return keys;
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

  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const weekSessions = await opportunitiesRepo.listInRange({
    fromIso: weekStart.toISOString(),
    toIso: weekEnd.toISOString(),
  });
  const weekIds = weekSessions.map((s) => s.id);
  const weekSignups = await signupsRepo.listByOpportunityIds(weekIds);
  const attendanceNeeded = weekSignups.filter(
    (s) => s.status === "confirmed" || s.status === "applied",
  ).length;
  const signupsToConfirm = weekSignups.filter((s) => s.status === "applied").length;

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

  let pendingProofs = 0;
  try {
    const proofsService = require("./proofs.service");
    pendingProofs = await proofsService.countPending();
  } catch {
    pendingProofs = 0;
  }

  if (pendingProofs > 0) {
    queue.push({
      id: "stories",
      title: "Story desk — photos to approve",
      detail:
        "Approve session photos to create a website note plus Instagram/Facebook caption drafts. Faces without consent stay blurred.",
      count: pendingProofs,
      href: "/admin/stories",
    });
  }

  if (signupsToConfirm > 0) {
    queue.push({
      id: "signups",
      title: "Class roll — signups to confirm",
      detail: "Volunteers who applied and still need a staff confirm before the session.",
      count: signupsToConfirm,
      href: "/admin/attendance",
    });
  }

  if (attendanceNeeded > 0 || weekSessions.length > 0) {
    queue.push({
      id: "attendance",
      title: "Class roll — mark attendance",
      detail:
        attendanceNeeded > 0
          ? "Mark who showed up so hours and badges stay accurate."
          : "Sessions on the calendar — confirm headcount when ready.",
      count: attendanceNeeded,
      href: "/admin/attendance",
    });
  }

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

  if (pendingProofs === 0) {
    queue.push({
      id: "stories-captions",
      title: "Story desk — caption drafts",
      detail:
        "Copy bilingual Instagram/Facebook captions and paste in the apps — no Meta publish from here.",
      count: null,
      href: "/admin/stories",
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
      pending_proofs: pendingProofs,
      impact_current,
    },
    charts: {
      donations_by_month,
      volunteer_hours_by_month,
    },
    queue,
  };
}

/**
 * Monday 00:00 UTC of the week containing `date`.
 *
 * @param {Date} date
 */
function startOfWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

module.exports = {
  getDashboard,
  lastSixMonths,
  fillMonthSeries,
};
