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
 * **Two different windows are in play, deliberately.** Session *eligibility* is a rolling
 * range anchored on the donation; *batching* (which edition the gift is reported in) is the
 * fixed calendar. They do not have to agree, and today they do not — a gift on the 2nd picks
 * sessions from 9 Aug–1 Sep but is reported under the 15–31 Aug edition, so the donor can see
 * listed sessions dated before the heading above them. Known and unresolved; do not "fix" one
 * side in isolation without deciding which window the donor-facing page should follow.
 *
 * The algorithm — deliberately small, so the invariants are all visible:
 *   1. If the donor opted out, do nothing. `tracking_opt_in` is the whole reason the
 *      allocation exists — a page nobody will see is state we don't need to keep.
 *   2. If `events_credited` is 0 or missing, do nothing. Same reason.
 *   3. Query eligible sessions in `[created_at + 7d, created_at + 30d]` — the rolling
 *      window above. The 7-day floor subsumes §15's 2-day rule, so no event can ever
 *      predate the gift that credited it.
 *   4. Snapshot `cost_at_allocation` from `donation.cost_per_event_at_donation` — never
 *      from the live constant. Revising the divisor later must not rewrite what a donor
 *      was already told.
 *   5. Find-or-open the donor_period for the donation's **edition** — `editionForDonation`
 *      on the fixed calendar, not the rolling window above, and not "the currently open
 *      one". `donors.service.js` sums `events_credited` through the same mapping, so the
 *      two must stay in step.
 *   6. Insert the allocations with `status='pending'`. Sessions have not happened yet.
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
    // The session rows behind those allocations, already in hand from the query above. The
    // thank-you email names the sessions a gift funded, and re-fetching them by id a moment
    // later would be a second round trip for data this function has and was discarding.
    sessions: eligible,
    period_id: period.id,
    insufficient: remaining > 0,
    remaining,
  };
}

function skipped() {
  return { allocations: [], period_id: null, insufficient: false, remaining: 0, skipped: true };
}

module.exports = { allocateForDonation, ELIGIBILITY_MIN_DAYS, ELIGIBILITY_MAX_DAYS };
