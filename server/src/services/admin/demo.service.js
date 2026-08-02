const { ApiError } = require("../../lib/api-error");
const donationsRepo = require("../../data/donations.repo");

// Internal force-state helpers for local testing (§16). Not surfaced on Admin
// Overview — staff UI shows live aggregates only. Remove or harden before
// production (§19).
//
// Live `donations.status` check is currently pending|succeeded|failed|refunded.
// CONTEXT §16 wants pending → planned → completed. In-memory rows use the
// CONTEXT machine; live rows map pending → succeeded.

/** CONTEXT §16 force path (in-memory gifts). */
const CONTEXT_ADVANCE = {
  pending: "planned",
  planned: "completed",
  completed: "completed",
};

/** Live DB statuses that exist today. */
const LIVE_ADVANCE = {
  pending: "succeeded",
  succeeded: "succeeded",
  failed: "failed",
  refunded: "refunded",
};

/**
 * @type {Array<{
 *   id: string,
 *   amount_hkd: number,
 *   status: string,
 *   programme: string,
 *   created_at: string,
 *   source: 'demo',
 * }>}
 */
const MEMORY_DONATIONS = [
  {
    id: "demo_gift_pending",
    amount_hkd: 500,
    status: "pending",
    programme: "sports",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: "demo",
  },
  {
    id: "demo_gift_planned",
    amount_hkd: 1200,
    status: "planned",
    programme: "nutrition",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    source: "demo",
  },
  {
    id: "demo_gift_completed",
    amount_hkd: 2500,
    status: "completed",
    programme: "sports",
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    source: "demo",
  },
];

/**
 * @param {string} donationId
 */
async function advanceDonation(donationId) {
  const memory = MEMORY_DONATIONS.find((d) => d.id === donationId);
  if (memory) {
    const current = memory.status;
    const next = CONTEXT_ADVANCE[current] || "planned";
    memory.status = next;
    return { donation: { ...memory }, from: current, to: next, source: "demo" };
  }

  const donation = await donationsRepo.findById(donationId);
  if (!donation) {
    throw ApiError.notFound("Donation not found");
  }

  const current = donation.status || "pending";
  const next = LIVE_ADVANCE[current];
  if (!next || next === current) {
    return {
      donation,
      from: current,
      to: current,
      source: "live",
      note: "Already at terminal live status (succeeded/failed/refunded).",
    };
  }

  const updated = await donationsRepo.updateStatus(donationId, next);
  return {
    donation: updated,
    from: current,
    to: next,
    source: "live",
    note: "Live schema uses pending → succeeded (CONTEXT planned/completed pending migration).",
  };
}

/**
 * Stub "run now" for fortnightly jobs that are not scheduled in this build.
 *
 * @param {string} job
 */
async function runNow(job) {
  const allowed = new Set([
    "allocations",
    "auto-complete-sessions",
    "monthly-donor-email",
    "handson-sync",
  ]);
  if (!allowed.has(job)) {
    throw ApiError.badRequest(`Unknown demo job: ${job}`);
  }
  return {
    job,
    ok: true,
    ran_at: new Date().toISOString(),
    note: "Stub — no cron ran; real version needs scheduled workers (§16).",
  };
}

/**
 * Recent donations for the internal advance picker — memory path first, then live.
 */
async function listDemoDonations() {
  let live = [];
  try {
    live = (await donationsRepo.listRecent(8)).map((d) => ({
      ...d,
      programme: d.programme ?? "where_needed",
      source: "live",
    }));
  } catch {
    live = [];
  }
  return [...MEMORY_DONATIONS.map((d) => ({ ...d })), ...live];
}

module.exports = { advanceDonation, runNow, listDemoDonations };
