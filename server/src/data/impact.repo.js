const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

/**
 * The single period flagged `is_current`.
 *
 * A partial unique index guarantees there is at most one, so `maybeSingle()` cannot
 * throw on a second row.
 *
 * @returns {Promise<object | null>}
 */
async function findCurrent() {
  const { data, error } = await getSupabase()
    .from("impact_periods")
    .select("*")
    .eq("is_current", true)
    .maybeSingle();

  assertOk(error);

  return data ?? null;
}

module.exports = { findCurrent };
