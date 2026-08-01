/**
 * How a gift becomes a number of events (PLAN.md Phase B).
 *
 * One flat divisor, deliberately: "HKD 100 supports one session" is explainable in a single
 * sentence on the donate form, and donors no longer choose a programme, so there is exactly
 * one figure to hold.
 */

/** The divisor. Snapshotted onto each donation as `cost_per_event_at_donation`. */
const COST_PER_EVENT_HKD = 100;

/**
 * Display limit, applied identically on the tracking page and in the edition email.
 * It caps what is *rendered*, never what is credited — see `creditFor`.
 */
const MAX_EVENTS_SHOWN = 10;

/**
 * Events a gift is credited with: `max(1, ceil(amount / cost))`.
 *
 * **`ceil`, not `floor`.** HKD 510 credits 6, not 5. The extra 10 dollars genuinely
 * contributed something to a sixth event, and the claim is "helped make possible", never
 * "paid for" (CONTEXT.md §15 copy rule). Under `floor` a 510 donor is told their last ten
 * dollars bought nothing.
 *
 * **Uncapped.** HKD 10,000 credits 100. The number is the honest one and every lifetime
 * total is built from it; only the rendered list is capped, at `MAX_EVENTS_SHOWN`.
 *
 * @param {number} amountHkd Integer dollars. Cents never cross this API (CONTEXT.md §29).
 * @param {number} [costPerEvent] Override, for replaying a historical snapshot.
 * @returns {number} At least 1.
 */
function creditFor(amountHkd, costPerEvent = COST_PER_EVENT_HKD) {
  if (!Number.isFinite(amountHkd) || amountHkd <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(amountHkd / costPerEvent));
}

module.exports = { COST_PER_EVENT_HKD, MAX_EVENTS_SHOWN, creditFor };
