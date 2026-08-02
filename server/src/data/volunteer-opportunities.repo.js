const { getServiceClient } = require("../config/supabase");
const { throwIfDbError } = require("./supabase-error");

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
  "spots_filled_handson",
  "min_age",
  "skills",
  "status",
  "source",
  "handson_url",
  "handson_opportunity_id",
  "last_synced_at",
].join(", ");

async function listOpportunities(filters = {}) {
  const db = getServiceClient();
  let query = db.from("volunteer_opportunities").select("*");

  if (filters.programme) {
    query = query.eq("programme", filters.programme);
  }

  if (filters.source) {
    query = query.eq("source", filters.source);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.from) {
    query = query.gte("starts_at", filters.from);
  }

  if (filters.to) {
    query = query.lte("starts_at", filters.to);
  }

  query = query.order("starts_at", { ascending: true });

  const { data, error } = await query;
  throwIfDbError(error);

  return data || [];
}

/**
 * Public listing — open and full only, paginated.
 *
 * @param {{ from: number, to: number, programme?: string, source?: string }} options
 */
async function listOpen({ from, to, programme, source }) {
  const db = getServiceClient();
  let query = db
    .from("volunteer_opportunities")
    .select(LIST_COLUMNS, { count: "exact" })
    .in("status", ["open"])
    .order("starts_at", { ascending: true })
    .range(from, to);

  if (programme) {
    query = query.eq("programme", programme);
  }

  if (source) {
    query = query.eq("source", source);
  }

  const { data, error, count } = await query;
  throwIfDbError(error);

  return { rows: data || [], total: count ?? 0 };
}

async function findOpportunityById(id) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_opportunities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwIfDbError(error);
  return data;
}

/**
 * @param {string} id
 */
async function findOpenById(id) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_opportunities")
    .select(LIST_COLUMNS)
    .eq("id", id)
    .in("status", ["open"])
    .maybeSingle();

  throwIfDbError(error);
  return data;
}

/**
 * Admin listing — every status, paginated. Public `listOpen` only surfaces open/full.
 *
 * @param {{ from: number, to: number, programme?: string, source?: string, status?: string }} options
 */
async function listForAdmin({ from, to, programme, source, status }) {
  const db = getServiceClient();
  let query = db
    .from("volunteer_opportunities")
    .select(LIST_COLUMNS, { count: "exact" })
    .order("starts_at", { ascending: false })
    .range(from, to);

  if (programme) {
    query = query.eq("programme", programme);
  }

  if (source) {
    query = query.eq("source", source);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;
  throwIfDbError(error);

  return { rows: data || [], total: count ?? 0 };
}

/**
 * @param {object} data
 */
async function createOpportunity(data) {
  const db = getServiceClient();
  const { data: inserted, error } = await db
    .from("volunteer_opportunities")
    .insert(data)
    .select(LIST_COLUMNS)
    .single();

  throwIfDbError(error);
  return inserted;
}

/**
 * @param {string} id
 */
async function deleteOpportunity(id) {
  const db = getServiceClient();
  const { error } = await db
    .from("volunteer_opportunities")
    .delete()
    .eq("id", id);

  throwIfDbError(error);
}

/**
 * @param {string} id
 * @param {object} patch
 */
async function updateOpportunity(id, patch) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_opportunities")
    .update(patch)
    .eq("id", id)
    .select(LIST_COLUMNS)
    .single();

  throwIfDbError(error);
  return data;
}

/**
 * @param {string[]} opportunityIds
 */
async function countInterestsByOpportunity(opportunityIds) {
  if (opportunityIds.length === 0) {
    return new Map();
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_interests")
    .select("opportunity_id")
    .in("opportunity_id", opportunityIds);

  throwIfDbError(error);

  const counts = new Map();
  for (const row of data || []) {
    counts.set(row.opportunity_id, (counts.get(row.opportunity_id) || 0) + 1);
  }

  return counts;
}

/**
 * Counts confirmed local signups for capacity math.
 *
 * @param {string[]} opportunityIds
 */
async function countLocalSignupsByOpportunity(opportunityIds) {
  if (opportunityIds.length === 0) {
    return new Map();
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_signups")
    .select("opportunity_id, status")
    .in("opportunity_id", opportunityIds)
    .eq("status", "confirmed");

  throwIfDbError(error);

  const counts = new Map();
  for (const row of data || []) {
    counts.set(row.opportunity_id, (counts.get(row.opportunity_id) || 0) + 1);
  }

  return counts;
}

/**
 * Roster size per opportunity — every signup that still stands, whatever became of it.
 *
 * Deliberately not `countLocalSignupsByOpportunity`, which counts `confirmed` only because
 * it answers "are there seats left". A past session whose volunteers are all `attended`
 * has a roster and no confirmed rows, and would report zero people through that helper.
 *
 * @param {string[]} opportunityIds
 */
async function countRosterByOpportunity(opportunityIds) {
  if (opportunityIds.length === 0) {
    return new Map();
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_signups")
    .select("opportunity_id")
    .in("opportunity_id", opportunityIds)
    .neq("status", "cancelled");

  throwIfDbError(error);

  const counts = new Map();
  for (const row of data || []) {
    counts.set(row.opportunity_id, (counts.get(row.opportunity_id) || 0) + 1);
  }

  return counts;
}

module.exports = {
  listOpportunities,
  listOpen,
  listForAdmin,
  findOpportunityById,
  findOpenById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  countInterestsByOpportunity,
  countLocalSignupsByOpportunity,
  countRosterByOpportunity,
};
