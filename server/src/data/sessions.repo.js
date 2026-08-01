const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

/** Columns the allocation service needs — never `select('*')`. */
const ELIGIBLE_COLUMNS =
  "id, title_en, title_zh, programme, starts_at, ends_at, location_en, location_zh, status";

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
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const { data, error } = await getSupabase()
    .from("sessions")
    .select(
      "id, title_en, title_zh, programme, starts_at, ends_at, location_en, location_zh, status, attendance_count, photo_url, note_en, note_zh, completed_at",
    )
    .eq("id", id)
    .maybeSingle();

  assertOk(error);
  return data;
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
    .select(
      "id, title_en, title_zh, programme, starts_at, ends_at, location_en, location_zh, status, attendance_count, photo_url, note_en, note_zh, completed_at",
    )
    .in("id", ids);

  assertOk(error);
  return data ?? [];
}

module.exports = { listEligibleForAllocation, findById, listByIds };
