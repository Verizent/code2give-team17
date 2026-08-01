const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");
const { ApiError } = require("../lib/api-error");

const COLUMNS = [
  "id",
  "opportunity_id",
  "volunteer_id",
  "message",
  "created_at",
].join(", ");

/**
 * @param {{ opportunity_id: string, volunteer_id: string, message?: string | null }} input
 * @returns {Promise<object>}
 */
async function insert(input) {
  const { data, error } = await getSupabase()
    .from("volunteer_interests")
    .insert({
      opportunity_id: input.opportunity_id,
      volunteer_id: input.volunteer_id,
      message: input.message ?? null,
    })
    .select(COLUMNS)
    .single();

  if (error?.code === "23505") {
    throw ApiError.conflict("Interest already registered for this opportunity");
  }
  assertOk(error);
  return data;
}

/**
 * Counts of leads per opportunity. Never mixed into spots_filled (§17 / §29).
 *
 * @param {string[]} opportunityIds
 * @returns {Promise<Map<string, number>>}
 */
async function countByOpportunityIds(opportunityIds) {
  const counts = new Map();
  if (!opportunityIds.length) return counts;

  const { data, error } = await getSupabase()
    .from("volunteer_interests")
    .select("opportunity_id")
    .in("opportunity_id", opportunityIds);
  assertOk(error);

  for (const row of data ?? []) {
    const id = row.opportunity_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/**
 * @param {string} volunteerId
 * @returns {Promise<object[]>}
 */
async function listByVolunteerId(volunteerId) {
  const { data, error } = await getSupabase()
    .from("volunteer_interests")
    .select(COLUMNS)
    .eq("volunteer_id", volunteerId)
    .order("created_at", { ascending: false });
  assertOk(error);
  return data ?? [];
}

/**
 * @returns {Promise<number>}
 */
async function countAll() {
  const { count, error } = await getSupabase()
    .from("volunteer_interests")
    .select("id", { count: "exact", head: true });
  assertOk(error);
  return count ?? 0;
}

module.exports = {
  insert,
  countByOpportunityIds,
  listByVolunteerId,
  countAll,
};
