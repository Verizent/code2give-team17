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

async function listAll({ from, to }) {
  const { data, error, count } = await getSupabase()
    .from("impact_periods")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  assertOk(error);
  return { rows: data ?? [], total: count ?? 0 };
}

async function findById(id) {
  const { data, error } = await getSupabase()
    .from("impact_periods")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  assertOk(error);
  return data ?? null;
}

async function create(data) {
  const { data: row, error } = await getSupabase()
    .from("impact_periods")
    .insert(data)
    .select("*")
    .single();
  assertOk(error);
  return row;
}

async function update(id, data) {
  const { data: row, error } = await getSupabase()
    .from("impact_periods")
    .update(data)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  assertOk(error);
  return row ?? null;
}

async function remove(id) {
  const { error } = await getSupabase().from("impact_periods").delete().eq("id", id);
  assertOk(error);
  return true;
}

module.exports = { findCurrent, listAll, findById, create, update, remove };
