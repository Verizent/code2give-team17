const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

/**
 * The webhook idempotency ledger.
 *
 * Stripe retries deliveries — on a timeout, a non-2xx, or a network blip. Without this table a
 * retried `checkout.session.completed` creates a second donation, a second credit, and a second
 * thank-you email. Recording the event id is the *first* thing the handler does.
 */

/**
 * Records an event, returning whether this is the first time we have seen it.
 *
 * Relies on the primary key rather than a read-then-write, which would race two concurrent
 * deliveries of the same event straight through the gap.
 *
 * @param {{ id: string, type: string }} event
 * @returns {Promise<boolean>} `true` if newly recorded, `false` if already processed.
 */
async function recordOnce(event) {
  const { error } = await getSupabase()
    .from("stripe_events")
    .insert({ event_id: event.id, type: event.type });

  // 23505 = unique_violation. Already processed, which is a success for our purposes.
  if (error?.code === "23505") {
    return false;
  }

  assertOk(error);
  return true;
}

module.exports = { recordOnce };
