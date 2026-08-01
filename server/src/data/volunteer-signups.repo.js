const { getServiceClient } = require("../config/supabase");
const { throwIfDbError, PG } = require("./supabase-error");
const { ApiError } = require("../lib/api-error");

const SIGNUP_COLUMNS = [
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
 * @param {object} values
 */
async function createSignup(values) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_signups")
    .insert({
      ...values,
      status: values.status ?? "confirmed",
    })
    .select(SIGNUP_COLUMNS)
    .single();

  if (error?.code === PG.UNIQUE_VIOLATION) {
    throw new ApiError(409, "Already signed up for this opportunity", "ALREADY_SIGNED_UP");
  }

  throwIfDbError(error, {
    conflictMessage: "You have already signed up for this opportunity",
  });
  return data;
}

async function findSignupById(id) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_signups")
    .select(
      "*, volunteer_opportunities(id, title_en, title_zh, starts_at, ends_at, programme, status)",
    )
    .eq("id", id)
    .maybeSingle();

  throwIfDbError(error);
  return data;
}

/**
 * @param {string} volunteerId
 * @param {{ opportunityId?: string }} [filters]
 */
async function listSignupsForVolunteer(volunteerId, filters = {}) {
  const db = getServiceClient();
  let query = db
    .from("volunteer_signups")
    .select(
      "*, volunteer_opportunities(id, title_en, title_zh, starts_at, ends_at, programme, status, location_en, location_zh)",
    )
    .eq("volunteer_id", volunteerId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (filters.opportunityId) {
    query = query.eq("opportunity_id", filters.opportunityId);
  }

  const { data, error } = await query;
  throwIfDbError(error);
  return data || [];
}

/**
 * @param {string} signupId
 */
async function cancelSignup(signupId) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_signups")
    .update({ status: "cancelled" })
    .eq("id", signupId)
    .neq("status", "cancelled")
    .select(SIGNUP_COLUMNS)
    .maybeSingle();

  throwIfDbError(error);
  return data;
}

async function deleteSignup(id) {
  const db = getServiceClient();
  const { error } = await db.from("volunteer_signups").delete().eq("id", id);
  throwIfDbError(error);
}

/**
 * @param {string} volunteerId
 */
async function listUpcomingSignups(volunteerId) {
  const signups = await listSignupsForVolunteer(volunteerId);
  const now = Date.now();

  return signups.filter((signup) => {
    if (!["applied", "confirmed"].includes(signup.status)) {
      return false;
    }

    const opportunity = signup.volunteer_opportunities;
    if (!opportunity?.starts_at) {
      return false;
    }

    return new Date(opportunity.starts_at).getTime() >= now;
  });
}

/**
 * @param {string} volunteerId
 */
async function sumHoursForVolunteer(volunteerId) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_signups")
    .select("hours_logged")
    .eq("volunteer_id", volunteerId);

  throwIfDbError(error);

  return (data || []).reduce((sum, row) => sum + Number(row.hours_logged || 0), 0);
}

module.exports = {
  createSignup,
  findSignupById,
  listSignupsForVolunteer,
  cancelSignup,
  deleteSignup,
  listUpcomingSignups,
  sumHoursForVolunteer,
};
