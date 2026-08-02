const { editionForDonation } = require("../../lib/donation-periods");
const sessionsRepo = require("../../data/sessions.repo");
const allocationsRepo = require("../../data/allocations.repo");
const donorPeriodsRepo = require("../../data/donor-periods.repo");

/** Rolling selection window per updated donor-track spec: sessions within 7–30 days
 *  ahead of the donation. Replaces the fixed-calendar edition-window selection —
 *  batching still uses the fixed calendar (see period lookup below), but session
 *  eligibility is a rolling range. */
const DAY_MS = 24 * 60 * 60 * 1000;
const ELIGIBILITY_MIN_DAYS = 7;
const ELIGIBILITY_MAX_DAYS = 30;

/**
 * Attaches a succeeded donation to real, upcoming sessions (CONTEXT.md §15).
 *
 * Called from the Stripe webhook after the donor is upserted and the donation is flipped
 * to `succeeded`. Also called from the pending-retry job when supply was thin on the
 * first attempt.
 *
 * The algorithm — deliberately small, so the invariants are all visible:
 *   1. If the donor opted out, do nothing. `tracking_opt_in` is the whole reason the
 *      allocation exists — a page nobody will see is state we don't need to keep.
 *   2. If `events_credited` is 0 or missing, do nothing. Same reason.
 *   3. Compute the edition window from the donation's own `created_at`, using the fixed
 *      calendar in donation-periods.js.
 *   4. Query eligible sessions in `[selectionStart, windowEnd)` — the selection floor
 *      keeps the event two days ahead of the email, per §15.
 *   5. Snapshot `cost_at_allocation` from `donation.cost_per_event_at_donation` — never
 *      from the live constant. Revising the divisor later must not rewrite what a donor
 *      was already told.
 *   6. Find-or-open the donor_period covering this window. Because §15's periods are
 *      per-donor rolling windows and this branch pins them to a fixed calendar, "the
 *      period for this window" is the right lookup — not "the currently open one".
 *   7. Insert the allocations with `status='pending'`. Sessions have not happened yet.
 *
 * If eligible < needed, insert what exists and report `insufficient: true` with the
 * remaining count. The pending-retry job (§16) picks these up.
 *
 * @param {object} donation
 * @returns {Promise<{ allocations: object[], period_id: string|null, insufficient: boolean, remaining: number, skipped?: boolean }>}
 */
async function allocateForDonation(donation) {
  if (!donation.tracking_opt_in) {
    return skipped();
  }

  const credited = Number(donation.events_credited) || 0;
  if (credited <= 0) {
    return skipped();
  }

  // Rolling window for session eligibility: [donation + 7d, donation + 30d].
  const donatedAt = new Date(donation.created_at);
  const windowStart = new Date(donatedAt.getTime() + ELIGIBILITY_MIN_DAYS * DAY_MS);
  const windowEnd = new Date(donatedAt.getTime() + ELIGIBILITY_MAX_DAYS * DAY_MS);

  const eligible = (
    await sessionsRepo.listEligibleForAllocation({
      windowStart,
      windowEnd,
      limit: credited,
    })
  ).slice(0, credited);

  // Period lookup stays on the fixed calendar — batching cadence (15th, EOM) is
  // calendar-based even though session eligibility is rolling.
  const edition = editionForDonation(donation.created_at);
  const period = await donorPeriodsRepo.findOrOpenForDonorWindow({
    donorId: donation.donor_id,
    windowStart: edition.windowStart,
    windowEnd: edition.windowEnd,
  });

  const rows = eligible.map((session) => ({
    donation_id: donation.id,
    session_id: session.id,
    donor_period_id: period.id,
    cost_at_allocation: donation.cost_per_event_at_donation,
    status: "pending",
  }));

  const allocations = rows.length > 0 ? await allocationsRepo.insertMany(rows) : [];

  const remaining = Math.max(0, credited - allocations.length);
  return {
    allocations,
    period_id: period.id,
    insufficient: remaining > 0,
    remaining,
  };
}

function skipped() {
  return { allocations: [], period_id: null, insufficient: false, remaining: 0, skipped: true };
}

module.exports = { allocateForDonation, ELIGIBILITY_MIN_DAYS, ELIGIBILITY_MAX_DAYS };
