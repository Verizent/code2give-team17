const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

/**
 * Named `volunteer-links` rather than `volunteers` on purpose: the volunteer track
 * will add its own `volunteers.repo.js` for signups and hours, and two files of the
 * same name is a merge conflict for no gain. This one owns the claim columns only.
 */
const LINK_COLUMNS = ["id", "email", "full_name", "profile_id", "claimed_at"].join(", ");

/**
 * Claims an unclaimed volunteer row for a profile.
 *
 * Both columns are set in ONE statement because `claimed_rows_carry_a_profile`
 * (`check ((claimed_at is null) = (profile_id is null))`) rejects the intermediate
 * state — two statements would be a guaranteed failure, not a latent one.
 *
 * `.is("profile_id", null)` is the entire concurrency story: a second concurrent
 * claim matches zero rows instead of stealing the row. No transaction is needed,
 * and PostgREST could not give us one anyway.
 *
 * @param {{ email: string, profileId: string }} options normalised email
 * @returns {Promise<object|null>} the claimed row, or null if nothing matched
 */
async function claimByEmail({ email, profileId }) {
  const { data, error } = await getSupabase()
    .from("volunteers")
    .update({ profile_id: profileId, claimed_at: new Date().toISOString() })
    .eq("email", email)
    .is("profile_id", null)
    .select(LINK_COLUMNS)
    .maybeSingle();

  assertOk(error);

  return data ?? null;
}

/**
 * Reads a volunteer by normalised email. Only called on the failure path, to tell
 * "never volunteered" apart from "already claimed".
 *
 * @param {string} email normalised
 * @returns {Promise<object|null>}
 */
async function findByEmail(email) {
  const { data, error } = await getSupabase()
    .from("volunteers")
    .select(LINK_COLUMNS)
    .eq("email", email)
    .maybeSingle();

  assertOk(error);

  return data ?? null;
}

module.exports = { claimByEmail, findByEmail, LINK_COLUMNS };
