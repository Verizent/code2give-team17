const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

const COLUMNS = ["id", "role", "email", "full_name", "locale", "phone"].join(", ");

/**
 * @param {string} id auth.users / profiles id
 * @returns {Promise<object | null>}
 */
async function findById(id) {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  // Table exists but service_role may lack GRANT until the profiles migration is applied.
  if (error && (error.code === "42501" || /permission denied/i.test(error.message || ""))) {
    return null;
  }
  assertOk(error);
  return data;
}

module.exports = { findById };
