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

module.exports = { findByEmail, findByToken, createDonor, updateDonor };
