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
 * Attended signups only — used by badge evaluation to sum hours, count distinct
 * programmes, and count signups. Includes the joined programme so callers do not
 * have to round-trip for it.
 *
 * @param {string} volunteerId
 */
async function listAttendedForVolunteer(volunteerId) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_signups")
    .select(
      "id, volunteer_id, status, hours_logged, attended_at, volunteer_opportunities(programme)",
    )
    .eq("volunteer_id", volunteerId)
    .eq("status", "attended");

  throwIfDbError(error);
  return data || [];
}

/**
 * Admin attendance-mark write path — sets `status`, `hours_logged`, `attended_at`
 * (server-side stamp). Returns the updated row joined with the volunteer and the
 * opportunity so the caller (attendance.service) can send the thank-you email
 * without a second round-trip.
 *
 * @param {string} signupId
 * @param {{ status: string, hours_logged: number, attended_at: string }} patch
 */
async function markAttendance(signupId, patch) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_signups")
    .update(patch)
    .eq("id", signupId)
    .select(
      `${SIGNUP_COLUMNS}, thank_you_email_sent_at,
       volunteers(id, email, full_name, locale),
       volunteer_opportunities(id, title_en, title_zh, programme, starts_at)`,
    )
    .single();

  throwIfDbError(error);
  return data;
}

/**
 * Full roster for an opportunity — admin dashboard read. Joins volunteer info
 * and returns every §23 field so the admin UI can render the attendance sheet
 * with feedback inline. Includes `no_show` rows too.
 *
 * @param {string} opportunityId
 */
async function listByOpportunity(opportunityId) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_signups")
    .select(
      `${SIGNUP_COLUMNS},
       discovery_source, discovery_source_other, signup_motivation,
       experience_rating, would_return, improvement_note, feedback_submitted_at,
       thank_you_email_sent_at,
       volunteers(id, email, full_name, locale)`,
    )
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: true });

  throwIfDbError(error);
  return data || [];
}

/**
 * Generic per-signup patch — used by the PATCH /api/volunteer-signups/:id
 * endpoint for §23 discovery + feedback fields. Kept separate from
 * `markAttendance` so a caller cannot accidentally mutate `status` or
 * `hours_logged` through the volunteer-facing endpoint (those columns are
 * admin-write only).
 *
 * @param {string} signupId
 * @param {Record<string, unknown>} patch
 */
async function patchSignupFields(signupId, patch) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_signups")
    .update(patch)
    .eq("id", signupId)
    .select(
      `${SIGNUP_COLUMNS}, discovery_source, discovery_source_other,
       signup_motivation, experience_rating, would_return, improvement_note,
       feedback_submitted_at`,
    )
    .single();

  throwIfDbError(error);
  return data;
}

/**
 * Stamps `thank_you_email_sent_at` — guards against double-sending after a
 * second attendance mark. Never awaited on the transaction path.
 *
 * @param {string} signupId
 * @param {string} iso
 */
async function markThankYouSent(signupId, iso) {
  const db = getServiceClient();
  const { error } = await db
    .from("volunteer_signups")
    .update({ thank_you_email_sent_at: iso })
    .eq("id", signupId);

  throwIfDbError(error);
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
  listAttendedForVolunteer,
  listByOpportunity,
  markAttendance,
  markThankYouSent,
  patchSignupFields,
  cancelSignup,
  deleteSignup,
  listUpcomingSignups,
  sumHoursForVolunteer,
};
