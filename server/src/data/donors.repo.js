const { getSupabase } = require("../config/supabase");

/**
 * @param {string} email Normalised (lowercase, trimmed) email.
 * @returns {Promise<object|null>}
 */
async function findByEmail(email) {
  const { data, error } = await getSupabase()
    .from("donors")
    .select("id, email, access_token, full_name, tracking_opt_in")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * @param {string} token
 * @returns {Promise<object|null>}
 */
async function findByToken(token) {
  const { data, error } = await getSupabase()
    .from("donors")
    .select("id, email, access_token, full_name, locale, tracking_opt_in")
    .eq("access_token", token)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * @param {{ email: string, full_name?: string, locale?: string, access_token: string, tracking_opt_in: boolean }} row
 * @returns {Promise<object>}
 */
async function createDonor(row) {
  const { data, error } = await getSupabase()
    .from("donors")
    .insert(row)
    .select("id, email, access_token, full_name")
    .single();

  if (error) throw error;
  return data;
}

/**
 * @param {string} id
 * @param {object} updates
 */
async function updateDonor(id, updates) {
  const { error } = await getSupabase().from("donors").update(updates).eq("id", id);
  if (error) throw error;
}

/**
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const { data, error } = await getSupabase()
    .from("donors")
    .select("id, email, access_token, full_name, locale, tracking_opt_in")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Admin list — donors ordered by created_at desc.
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<object[]>}
 */
async function listRecent({ limit = 50 } = {}) {
  const { data, error } = await getSupabase()
    .from("donors")
    .select("id, email, full_name, locale, tracking_opt_in, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 200));
  if (error) throw error;
  return data ?? [];
}

module.exports = { findByEmail, findByToken, findById, createDonor, updateDonor, listRecent };
