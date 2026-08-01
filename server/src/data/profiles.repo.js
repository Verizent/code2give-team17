const { getSupabase } = require("../config/supabase");
const { ApiError } = require("../lib/api-error");
const { assertOk } = require("./supabase-error");

const PROFILE_COLUMNS = ["id", "role", "full_name", "locale"].join(", ");

/**
 * @param {string} id the Supabase Auth user id — profiles.id IS auth.users.id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  assertOk(error);

  return data ?? null;
}

/**
 * Creates a profile if one does not already exist, and returns the current row.
 *
 * `ignoreDuplicates` makes two concurrent first-requests benign: the loser inserts
 * nothing and the follow-up read returns the winner's row.
 *
 * NOTE the signature takes no role. Provisioning is always `volunteer`
 * (`authenticate.js` hardcodes it, and the column defaults to it) — a parameter here
 * would be the hook someone eventually passes token metadata into.
 *
 * @param {{ id: string, email: string, full_name: string|null, locale?: string }} profile
 * @returns {Promise<object>}
 */
async function insertIfAbsent(profile) {
  const { error } = await getSupabase()
    .from("profiles")
    .upsert({ ...profile, role: "volunteer" }, {
      onConflict: "id",
      ignoreDuplicates: true,
    });

  assertOk(error);

  const row = await findById(profile.id);

  if (!row) {
    // Declared as returning a row, and `authenticate.js` reads `.role` off it
    // immediately. Returning null here would surface as a TypeError and a bare 500
    // with nothing naming the cause.
    throw new ApiError(503, "Profile was provisioned but could not be read back");
  }

  return row;
}

module.exports = { findById, insertIfAbsent, PROFILE_COLUMNS };
