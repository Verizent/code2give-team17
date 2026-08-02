const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");
const { ApiError } = require("../lib/api-error");

const COLUMNS = [
  "id",
  "opportunity_id",
  "volunteer_id",
  "profile_id",
  "status",
  "hours_logged",
  "attended_at",
  "created_at",
  "updated_at",
].join(", ");

/**
 * @param {{ opportunity_id: string, volunteer_id: string, profile_id?: string | null, status?: string }} input
 * @returns {Promise<object>}
 */
async function insert(input) {
  const { data, error } = await getSupabase()
    .from("volunteer_signups")
    .insert({
      opportunity_id: input.opportunity_id,
      volunteer_id: input.volunteer_id,
      profile_id: input.profile_id ?? null,
      status: input.status ?? "confirmed",
    })
    .select(COLUMNS)
    .single();

  if (error?.code === "23505") {
    throw new ApiError(
      409,
      "Already signed up for this opportunity",
      "ALREADY_SIGNED_UP",
    );
  }
  assertOk(error);
  return data;
}

/**
 * @param {string} volunteerId
 * @returns {Promise<object[]>}
 */
async function listByVolunteerId(volunteerId) {
  const { data, error } = await getSupabase()
    .from("volunteer_signups")
    .select(COLUMNS)
    .eq("volunteer_id", volunteerId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  assertOk(error);
  return data ?? [];
}

/**
 * @param {string} signupId
 * @returns {Promise<object | null>}
 */
async function findById(signupId) {
  const { data, error } = await getSupabase()
    .from("volunteer_signups")
    .select(COLUMNS)
    .eq("id", signupId)
    .maybeSingle();
  assertOk(error);
  return data;
}

/**
 * Soft-cancel a signup.
 *
 * @param {string} signupId
 * @returns {Promise<object>}
 */
async function cancel(signupId) {
  const { data, error } = await getSupabase()
    .from("volunteer_signups")
    .update({ status: "cancelled" })
    .eq("id", signupId)
    .select(COLUMNS)
    .single();
  assertOk(error);
  return data;
}

/*
 * claimSpot / releaseSpot lived here and were never called by anything. They mutated
 * volunteer_opportunities.spots_filled as a running counter and wrote status='full' —
 * a second, conflicting model of capacity alongside the one that is actually used, where
 * local signups are counted as rows and fullness is derived. Removed rather than renamed
 * onto spots_filled_handson: reviving them would reintroduce the drift that made a
 * capacity-6 session with zero signups report itself full.
 */

/**
 * @param {string[]} opportunityIds
 * @returns {Promise<object[]>}
 */
async function listByOpportunityIds(opportunityIds) {
  if (!opportunityIds.length) return [];
  const { data, error } = await getSupabase()
    .from("volunteer_signups")
    .select(COLUMNS)
    .in("opportunity_id", opportunityIds)
    .neq("status", "cancelled")
    .order("created_at", { ascending: true });
  assertOk(error);
  return data ?? [];
}

/**
 * Mark a signup attended and optionally set hours.
 *
 * @param {string} signupId
 * @param {{ hours_logged?: number }} opts
 * @returns {Promise<object>}
 */
async function markAttended(signupId, opts = {}) {
  const patch = {
    status: "attended",
    attended_at: new Date().toISOString(),
  };
  if (opts.hours_logged != null) {
    patch.hours_logged = opts.hours_logged;
  }

  const { data, error } = await getSupabase()
    .from("volunteer_signups")
    .update(patch)
    .eq("id", signupId)
    .select(COLUMNS)
    .single();
  assertOk(error);
  return data;
}

/**
 * Attended signups for a volunteer (badge evaluation).
 *
 * @param {string} volunteerId
 * @returns {Promise<object[]>}
 */
async function listAttendedByVolunteerId(volunteerId) {
  const { data, error } = await getSupabase()
    .from("volunteer_signups")
    .select(COLUMNS)
    .eq("volunteer_id", volunteerId)
    .eq("status", "attended")
    .order("attended_at", { ascending: true });
  assertOk(error);
  return data ?? [];
}

/**
 * Hours logged per calendar month (attended signups).
 *
 * @returns {Promise<Array<{ month: string, hours: number }>>}
 */
async function hoursByMonth() {
  const { data, error } = await getSupabase()
    .from("volunteer_signups")
    .select("hours_logged, attended_at, status, created_at")
    .in("status", ["attended", "confirmed"]);
  assertOk(error);

  /** @type {Map<string, number>} */
  const byMonth = new Map();
  for (const row of data ?? []) {
    const when = row.attended_at || row.created_at;
    if (!when) continue;
    const month = String(when).slice(0, 7);
    const hours = Number(row.hours_logged) || 0;
    byMonth.set(month, (byMonth.get(month) ?? 0) + hours);
  }
  return [...byMonth.entries()].map(([month, hours]) => ({ month, hours }));
}

/**
 * @returns {Promise<number>}
 */
async function countAll() {
  const { count, error } = await getSupabase()
    .from("volunteer_signups")
    .select("id", { count: "exact", head: true });
  assertOk(error);
  return count ?? 0;
}

/**
 * How volunteers said they found Love 21 (form answers, not UTMs).
 *
 * @returns {Promise<Array<{ source: string, count: number }>>}
 */
async function countByDiscoverySource() {
  const { data, error } = await getSupabase()
    .from("volunteer_signups")
    .select("discovery_source");
  assertOk(error);

  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const row of data ?? []) {
    const source = row.discovery_source || "unknown";
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }
  return [...counts.entries()].map(([source, count]) => ({ source, count }));
}

module.exports = {
  insert,
  listByVolunteerId,
  findById,
  cancel,
  listByOpportunityIds,
  markAttended,
  listAttendedByVolunteerId,
  hoursByMonth,
  countAll,
  countByDiscoverySource,
};
