const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

/**
 * Two tracks wrote a sessions repo independently and both landed at this path: the admin
 * track needs CRUD for the dashboard, the donations track needs read paths for the
 * allocation engine. They are unioned here rather than one overwriting the other.
 *
 * The column lists stayed separate on purpose. `sessions` carries two overlapping
 * bilingual designs — `description_en/_zh` + `location` from the admin migration, and
 * `note_en/_zh` + `location_en/_zh` + `completed_at` added by 20260803_1075 to unblock
 * the donations repo. Both sets exist on live, and collapsing them is a schema decision,
 * not a merge decision. Each list therefore asks for what its own consumer parses, and
 * DETAIL_COLUMNS is the superset for the one function both tracks call.
 */

/** Admin dashboard CRUD projection. */
const ADMIN_COLUMNS = [
  "id", "programme", "title_en", "title_zh",
  "description_en", "description_zh",
  "starts_at", "ends_at", "location",
  "capacity", "attendance_count", "attendance_source", "photo_url",
  "estimated_cost_hkd", "status", "created_at", "updated_at",
].join(", ");

/** Columns the allocation service needs — never `select('*')`. */
const ELIGIBLE_COLUMNS =
  "id, title_en, title_zh, programme, starts_at, ends_at, location_en, location_zh, status";

/**
 * Superset used by `findById`, which both tracks call. Covers every column either
 * consumer reads, so neither gets `undefined` for a field it renders.
 */
const DETAIL_COLUMNS = [
  "id", "programme", "title_en", "title_zh",
  "description_en", "description_zh",
  "note_en", "note_zh",
  "starts_at", "ends_at",
  "location", "location_en", "location_zh",
  "capacity", "attendance_count", "attendance_source", "photo_url",
  "estimated_cost_hkd", "status", "completed_at", "created_at", "updated_at",
].join(", ");

/** @returns {Promise<{ rows: object[], total: number }>} */
async function listAll({ status, from, to }) {
  let query = getSupabase()
    .from("sessions")
    .select(ADMIN_COLUMNS, { count: "exact" })
    .order("starts_at", { ascending: true })
    .range(from, to);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  assertOk(error);
  return { rows: data ?? [], total: count ?? 0 };
}

/**
 * @param {string} id
 * @returns {Promise<object | null>}
 */
async function findById(id) {
  const { data, error } = await getSupabase()
    .from("sessions")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  assertOk(error);
  return data ?? null;
}

/** @returns {Promise<object>} */
async function create(data) {
  const { data: row, error } = await getSupabase()
    .from("sessions")
    .insert(data)
    .select(ADMIN_COLUMNS)
    .single();
  assertOk(error);
  return row;
}

/** @returns {Promise<object | null>} */
async function update(id, data) {
  const { data: row, error } = await getSupabase()
    .from("sessions")
    .update(data)
    .eq("id", id)
    .select(ADMIN_COLUMNS)
    .maybeSingle();
  assertOk(error);
  return row ?? null;
}

/** @returns {Promise<object | null>} */
async function cancel(id) {
  return update(id, { status: "cancelled" });
}

/**
 * Records attendance for a single session.
 * @returns {Promise<object | null>}
 */
async function recordAttendance(id, { attendance_count, photo_url }) {
  const patch = { attendance_count, attendance_source: "manual", status: "completed" };
  if (photo_url !== undefined) patch.photo_url = photo_url;
  return update(id, patch);
}

/** @returns {Promise<boolean>} */
async function remove(id) {
  const { error } = await getSupabase().from("sessions").delete().eq("id", id);
  assertOk(error);
  return true;
}

/**
 * Sessions that can carry a new allocation right now.
 *
 * §15: window is `[windowStart, windowEnd)` with the selection floor already applied
 * by the caller — the repo doesn't recompute it. Ordering is soonest first: fewest-first
 * across all allocations is a spread-across-donors property that only matters when supply
 * is tight, and for the demo, starts_at ascending gives a stable, explainable order.
 *
 * @param {{ windowStart: Date, windowEnd: Date, limit: number }} opts
 * @returns {Promise<object[]>}
 */
async function listEligibleForAllocation({ windowStart, windowEnd, limit }) {
  const { data, error } = await getSupabase()
    .from("sessions")
    .select(ELIGIBLE_COLUMNS)
    .eq("status", "scheduled")
    .gte("starts_at", windowStart.toISOString())
    .lt("starts_at", windowEnd.toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);

  assertOk(error);
  return data ?? [];
}

/**
 * Sessions that a donor already has allocations on. Used by the track endpoint.
 *
 * @param {string[]} ids
 * @returns {Promise<object[]>}
 */
async function listByIds(ids) {
  if (ids.length === 0) return [];
  const { data, error } = await getSupabase()
    .from("sessions")
    .select(DETAIL_COLUMNS)
    .in("id", ids);

  assertOk(error);
  return data ?? [];
}

module.exports = {
  listAll,
  findById,
  create,
  update,
  cancel,
  recordAttendance,
  remove,
  listEligibleForAllocation,
  listByIds,
};
