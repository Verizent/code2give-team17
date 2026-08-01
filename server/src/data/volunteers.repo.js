const crypto = require("node:crypto");
const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

const COLUMNS = [
  "id",
  "email",
  "full_name",
  "phone",
  "locale",
  "profile_id",
  "claimed_at",
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
    .from("volunteers")
    .select(COLUMNS)
    .eq("email", email)
    .maybeSingle();
  assertOk(error);
  return data;
}

/**
 * @param {string} profileId auth.users id
 * @returns {Promise<object | null>}
 */
async function findByProfileId(profileId) {
  const { data, error } = await getSupabase()
    .from("volunteers")
    .select(COLUMNS)
    .eq("profile_id", profileId)
    .maybeSingle();
  assertOk(error);
  return data;
}

/**
 * @param {{ email: string, full_name: string, phone?: string | null, locale?: string, profile_id?: string | null }} input
 * @returns {Promise<object>}
 */
async function insert(input) {
  const row = {
    email: input.email,
    full_name: input.full_name,
    phone: input.phone ?? null,
    locale: input.locale === "zh-Hant" ? "zh-Hant" : "en",
    access_token: newAccessToken(),
    profile_id: input.profile_id ?? null,
    claimed_at: input.profile_id ? new Date().toISOString() : null,
  };

  const { data, error } = await getSupabase()
    .from("volunteers")
    .insert(row)
    .select(COLUMNS)
    .single();
  assertOk(error);
  return data;
}

/**
 * Link an existing volunteer row to an auth user (claim soft identity).
 *
 * @param {string} volunteerId
 * @param {string} profileId
 * @returns {Promise<object>}
 */
async function claim(volunteerId, profileId) {
  const { data, error } = await getSupabase()
    .from("volunteers")
    .update({
      profile_id: profileId,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", volunteerId)
    .is("profile_id", null)
    .select(COLUMNS)
    .single();
  assertOk(error);
  return data;
}

/**
 * @param {string} volunteerId
 * @param {{ full_name?: string, phone?: string | null }} patch
 */
async function updateBasics(volunteerId, patch) {
  const { data, error } = await getSupabase()
    .from("volunteers")
    .update(patch)
    .eq("id", volunteerId)
    .select(COLUMNS)
    .single();
  assertOk(error);
  return data;
}

module.exports = {
  findByEmail,
  findByProfileId,
  insert,
  claim,
  updateBasics,
  newAccessToken,
};
