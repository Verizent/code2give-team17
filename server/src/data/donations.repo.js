const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

/**
 * @param {{ donor_id: string, amount_hkd: number, frequency?: string, campaign_id?: string|null, status?: string }} row
 * @returns {Promise<object>}
 */
async function insertDonation(row) {
  const { data, error } = await getSupabase()
    .from("donations")
    .insert({ status: "succeeded", ...row })
    .select("id, amount_hkd, frequency, status, created_at")
    .single();

  assertOk(error);
  return data;
}

/**
 * Second line of defence on idempotency: the same `stripe_session_id` must never produce two
 * rows. `stripe_events` is the first — see `stripe-events.repo.js`.
 *
 * @param {string} sessionId
 * @returns {Promise<object|null>}
 */
async function findByStripeSession(sessionId) {
  const { data, error } = await getSupabase()
    .from("donations")
    .select(
      "id, donor_id, amount_hkd, frequency, status, events_credited, cost_per_event_at_donation, tracking_opt_in, created_at",
    )
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  assertOk(error);
  return data;
}

/**
 * Creates the `pending` row that a checkout session points at.
 *
 * `donor_id` is deliberately absent — the donate form collects nothing Stripe already collects
 * (CONTEXT.md §15), so the donor is not known until the webhook carries their email. The column
 * is nullable for exactly this window.
 *
 * @param {{ amount_hkd: number, frequency: string, campaign_id?: string|null,
 *   stripe_session_id: string, tracking_opt_in?: boolean }} row
 * @returns {Promise<object>}
 */
async function insertPendingDonation(row) {
  const { data, error } = await getSupabase()
    .from("donations")
    .insert({ ...row, status: "pending" })
    .select("id, amount_hkd, frequency, status, stripe_session_id, created_at")
    .single();

  assertOk(error);
  return data;
}

/**
 * @param {string} id
 * @param {object} updates
 */
async function updateDonation(id, updates) {
  const { error } = await getSupabase().from("donations").update(updates).eq("id", id);
  assertOk(error);
}

/**
 * Succeeded donations for a donor, newest first.
 *
 * `events_credited` and `created_at` come back because the lifetime strip and the edition
 * windows are both derived from them (PLAN.md Phase B) — nothing is stored as a counter.
 *
 * @param {string} donorId
 * @returns {Promise<object[]>}
 */
async function listByDonor(donorId) {
  const { data, error } = await getSupabase()
    .from("donations")
    .select(
      "id, amount_hkd, frequency, status, events_credited, cost_per_event_at_donation, created_at",
    )
    .eq("donor_id", donorId)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false });

  assertOk(error);
  return data ?? [];
}

/**
 * Fetch a single donation by id — for post-payment feedback (§Phase C3).
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const { data, error } = await getSupabase()
    .from("donations")
    .select("id, donor_id, amount_hkd, frequency, status, events_credited, cost_per_event_at_donation, tracking_opt_in, created_at, message, referral_source, is_anonymous")
    .eq("id", id)
    .maybeSingle();
  assertOk(error);
  return data;
}

/**
 * Whitelist-writing update for post-payment feedback. Fields already narrowed at the
 * service layer — repo just persists.
 * @param {string} id
 * @param {{ message?: string, referral_source?: string, referral_source_other?: string, is_anonymous?: boolean }} fields
 * @returns {Promise<object>}
 */
async function updateFeedback(id, fields) {
  const { data, error } = await getSupabase()
    .from("donations")
    .update(fields)
    .eq("id", id)
    .select("id, message, referral_source, referral_source_other, is_anonymous, updated_at")
    .single();
  assertOk(error);
  return data;
}

module.exports = {
  insertDonation,
  insertPendingDonation,
  findByStripeSession,
  findById,
  updateDonation,
  updateFeedback,
  listByDonor,
};
