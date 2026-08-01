const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

const LIST_COLUMNS = [
  "id",
  "title_en",
  "title_zh",
  "description_en",
  "description_zh",
  "location_en",
  "location_zh",
  "programme",
  "starts_at",
  "ends_at",
  "capacity",
  "spots_filled",
  "min_age",
  "skills",
  "status",
  "source",
  "handson_url",
  "handson_opportunity_id",
  "last_synced_at",
].join(", ");

/**
 * Open / full listings, soonest first. Draft / closed / cancelled stay admin-only.
 *
 * @param {{ from: number, to: number, programme?: string, source?: string }} options
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function listOpen({ from, to, programme, source }) {
  let query = getSupabase()
    .from("volunteer_opportunities")
    .select(LIST_COLUMNS, { count: "exact" })
    .in("status", ["open", "full"])
    .order("starts_at", { ascending: true })
    .range(from, to);

  if (programme) {
    query = query.eq("programme", programme);
  }
  if (source) {
    query = query.eq("source", source);
  }

  const { data, error, count } = await query;
  assertOk(error);

  return { rows: data ?? [], total: count ?? 0 };
}

/**
 * @param {string} id
 * @returns {Promise<object | null>}
 */
async function findOpenById(id) {
  const { data, error } = await getSupabase()
    .from("volunteer_opportunities")
    .select(LIST_COLUMNS)
    .eq("id", id)
    .in("status", ["open", "full"])
    .maybeSingle();

  assertOk(error);
  return data;
}

module.exports = { listOpen, findOpenById };
