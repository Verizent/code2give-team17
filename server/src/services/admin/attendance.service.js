const { ApiError } = require("../../lib/api-error");
const { resolveLocale } = require("../../lib/locale");
const opportunitiesRepo = require("../../data/opportunities.repo");
const signupsRepo = require("../../data/signups.repo");
const volunteersRepo = require("../../data/volunteers.repo");
const badgesService = require("../volunteering/badges.service");

/**
 * @param {string} fromIso
 * @param {string} toIso
 * @param {string} [locale]
 */
async function listAttendance(fromIso, toIso, locale = "en") {
  const opportunities = await opportunitiesRepo.listInRange({ fromIso, toIso });
  const ids = opportunities.map((o) => o.id);
  const signups = await signupsRepo.listByOpportunityIds(ids);

  const volunteerIds = [...new Set(signups.map((s) => s.volunteer_id))];
  /** @type {Map<string, object>} */
  const volunteers = new Map();
  for (const id of volunteerIds) {
    const v = await volunteersRepo.findById(id);
    if (v) volunteers.set(id, v);
  }

  const byOpp = new Map();
  for (const id of ids) byOpp.set(id, []);
  for (const signup of signups) {
    const list = byOpp.get(signup.opportunity_id);
    if (!list) continue;
    const volunteer = volunteers.get(signup.volunteer_id);
    list.push({
      id: signup.id,
      status: signup.status,
      hours_logged: Number(signup.hours_logged) || 0,
      attended_at: signup.attended_at,
      volunteer: volunteer
        ? {
            id: volunteer.id,
            full_name: volunteer.full_name,
            email: volunteer.email,
          }
        : { id: signup.volunteer_id, full_name: null, email: null },
    });
  }

  return opportunities.map((row) => {
    const localised = resolveLocale(
      row,
      ["title", "description", "location"],
      locale,
    );
    const roster = byOpp.get(row.id) ?? [];
    return {
      id: row.id,
      title: localised.title,
      location: localised.location,
      programme: row.programme,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      capacity: row.capacity,
      spots_filled: row.spots_filled,
      source: row.source,
      signups: roster,
      headcount_confirmed: roster.filter((s) => s.status === "attended").length,
      headcount_expected: roster.filter((s) => s.status !== "no_show").length,
    };
  });
}

/**
 * Mark one signup attended and run badge evaluation (§16).
 *
 * @param {string} signupId
 * @param {{ hours_logged?: number }} body
 */
async function markAttendance(signupId, body = {}) {
  const signup = await signupsRepo.findById(signupId);
  if (!signup || signup.status === "cancelled") {
    throw ApiError.notFound("Signup not found");
  }
  if (signup.status === "attended") {
    return { signup, badges_awarded: [] };
  }

  let hours = body.hours_logged;
  if (hours == null) {
    const opportunity = await opportunitiesRepo.findById(signup.opportunity_id);
    if (opportunity?.starts_at && opportunity?.ends_at) {
      const ms =
        new Date(opportunity.ends_at).getTime() -
        new Date(opportunity.starts_at).getTime();
      if (ms > 0) hours = Math.round((ms / 3_600_000) * 10) / 10;
    }
    if (hours == null) hours = 1.5;
  }

  const updated = await signupsRepo.markAttended(signupId, {
    hours_logged: hours,
  });

  let badges_awarded = [];
  try {
    badges_awarded = await badgesService.evaluateForVolunteer(updated.volunteer_id);
  } catch {
    // Badge tables may be empty in some environments — attendance still succeeds.
    badges_awarded = [];
  }

  return { signup: updated, badges_awarded };
}

module.exports = { listAttendance, markAttendance };
