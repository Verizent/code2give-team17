const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

const COLUMNS = [
  "id", "programme", "title_en", "title_zh",
  "description_en", "description_zh",
  "starts_at", "ends_at", "location",
  "capacity", "attendance_count", "attendance_source", "photo_url",
  "estimated_cost_hkd", "status", "created_at", "updated_at",
].join(", ");

/** @returns {Promise<{ rows: object[], total: number }>} */
async function listAll({ status, from, to }) {
  let query = getSupabase()
    .from("sessions")
    .select(COLUMNS, { count: "exact" })
    .order("starts_at", { ascending: true })
    .range(from, to);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  assertOk(error);
  return { rows: data ?? [], total: count ?? 0 };
}

/** @returns {Promise<object | null>} */
async function findById(id) {
  const { data, error } = await getSupabase()
    .from("sessions")
    .select(COLUMNS)
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
    .select(COLUMNS)
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
    .select(COLUMNS)
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

module.exports = { listAll, findById, create, update, cancel, recordAttendance, remove };
