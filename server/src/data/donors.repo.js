const crypto = require("node:crypto");
const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

const COLUMNS = [
  "id",
  "email",
  "full_name",
  "locale",
  "profile_id",
  "tracking_opt_in",
  "access_token",
  "created_at",
  "updated_at",
].join(", ");

function newAccessToken() {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * @param {string} email normalised
 * @returns {Promise<object | null>}
 */
async function findByEmail(email) {
  const { data, error } = await getSupabase()
    .from("donors")
    .select(COLUMNS)
    .eq("email", email)
    .maybeSingle();
  assertOk(error);
  return data;
}

/**
 * @param {string} profileId
 * @returns {Promise<object | null>}
 */
async function findByProfileId(profileId) {
  const { data, error } = await getSupabase()
    .from("donors")
    .select(COLUMNS)
    .eq("profile_id", profileId)
    .maybeSingle();
  assertOk(error);
  return data;
}

/**
 * @param {string} token
 * @returns {Promise<object | null>}
 */
async function findByAccessToken(token) {
  const { data, error } = await getSupabase()
    .from("donors")
    .select(COLUMNS)
    .eq("access_token", token)
    .maybeSingle();
  assertOk(error);
  return data;
}

/**
 * @param {{ email: string, full_name?: string | null, locale?: string, tracking_opt_in?: boolean, profile_id?: string | null }} input
 * @returns {Promise<object>}
 */
async function insert(input) {
  const row = {
    email: input.email,
    full_name: input.full_name ?? null,
    locale: input.locale === "zh-Hant" ? "zh-Hant" : "en",
    tracking_opt_in: Boolean(input.tracking_opt_in),
    access_token: newAccessToken(),
    profile_id: input.profile_id ?? null,
  };

  const { data, error } = await getSupabase()
    .from("donors")
    .insert(row)
    .select(COLUMNS)
    .single();
  assertOk(error);
  return data;
}

/**
 * @param {string} donorId
 * @param {{ tracking_opt_in?: boolean, full_name?: string | null, profile_id?: string | null }} patch
 */
async function update(donorId, patch) {
  const { data, error } = await getSupabase()
    .from("donors")
    .update(patch)
    .eq("id", donorId)
    .select(COLUMNS)
    .single();
  assertOk(error);
  return data;
}

module.exports = {
  findByEmail,
  findByProfileId,
  findByAccessToken,
  insert,
  update,
  newAccessToken,
};
