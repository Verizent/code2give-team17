const { getServiceClient } = require("../config/supabase");
const { throwIfDbError, PG } = require("./supabase-error");
const { ApiError } = require("../lib/api-error");

/**
 * @param {object} values
 */
async function createInterest(values) {
  const db = getServiceClient();
  const { data, error } = await db.from("volunteer_interests").insert(values).select().single();

  if (error?.code === PG.UNIQUE_VIOLATION) {
    throw new ApiError(409, "You have already expressed interest in this opportunity");
  }

  throwIfDbError(error, {
    conflictMessage: "You have already expressed interest in this opportunity",
  });
  return data;
}

/**
 * @param {string[]} opportunityIds
 */
async function countByOpportunityIds(opportunityIds) {
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

module.exports = { createInterest, countByOpportunityIds };
