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

/**
 * Admin dashboard: recent donations, newest first.
 * @param {{ limit?: number, status?: string }} [opts]
 * @returns {Promise<object[]>}
 */
async function listRecent({ limit = 50, status } = {}) {
  let query = getSupabase()
    .from("donations")
    .select("id, donor_id, amount_hkd, frequency, status, events_credited, cost_per_event_at_donation, is_anonymous, message, referral_source, stripe_session_id, stripe_payment_intent, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 200));
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  assertOk(error);
  return data ?? [];
}

/**
 * Lifetime totals across settled money only.
 *
 * `pending` rows are excluded on purpose: a started-but-abandoned checkout writes one,
 * so counting them would report money the charity never received.
 *
 * @returns {Promise<{ total_hkd: number, count: number }>}
 */
async function sumAmounts() {
  const { data, error } = await getSupabase()
    .from("donations")
    .select("amount_hkd")
    .eq("status", "succeeded");

  assertOk(error);

  const rows = data ?? [];
  return {
    total_hkd: rows.reduce((sum, row) => sum + (Number(row.amount_hkd) || 0), 0),
    count: rows.length,
  };
}

/**
 * Settled donation totals grouped by UTC calendar month.
 *
 * Summed here rather than in SQL because PostgREST cannot express `group by` without a
 * database function, and the dashboard only ever charts the last six months of a table
 * this demo keeps small. Revisit as an RPC if `donations` ever outgrows one page.
 *
 * @returns {Promise<{ month: string, amount_hkd: number }[]>} oldest first
 */
async function sumByMonth() {
  const { data, error } = await getSupabase()
    .from("donations")
    .select("amount_hkd, created_at")
    .eq("status", "succeeded")
    .order("created_at", { ascending: true });

  assertOk(error);

  const totals = new Map();
  for (const row of data ?? []) {
    if (!row.created_at) continue;
    const month = new Date(row.created_at).toISOString().slice(0, 7);
    totals.set(month, (totals.get(month) ?? 0) + (Number(row.amount_hkd) || 0));
  }

  return [...totals].map(([month, amount_hkd]) => ({ month, amount_hkd }));
}

module.exports = {
  insertDonation,
  insertPendingDonation,
  findByStripeSession,
  findById,
  updateDonation,
  updateFeedback,
  listByDonor,
  listRecent,
  sumAmounts,
  sumByMonth,
};
