const { getSupabase } = require("../config/supabase");

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

  if (error) throw error;
  return data;
}

/**
 * Used for idempotency: same stripe_session_id must never produce two rows.
 * @param {string} sessionId
 * @returns {Promise<object|null>}
 */
async function findByStripeSession(sessionId) {
  const { data, error } = await getSupabase()
    .from("donations")
    .select("id, status")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * @param {string} id
 * @param {object} updates
 */
async function updateDonation(id, updates) {
  const { error } = await getSupabase().from("donations").update(updates).eq("id", id);
  if (error) throw error;
}

/**
 * @param {string} donorId
 * @returns {Promise<object[]>}
 */
async function listByDonor(donorId) {
  const { data, error } = await getSupabase()
    .from("donations")
    .select("id, amount_hkd, frequency, status, created_at")
    .eq("donor_id", donorId)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

module.exports = { insertDonation, findByStripeSession, updateDonation, listByDonor };
