const { getSupabase } = require("../../config/supabase");
const { assertOk } = require("../../data/supabase-error");
const signupsRepo = require("../../data/signups.repo");

/**
 * Soft badge evaluation after attendance. Awards matching definitions when
 * thresholds are met; unique (volunteer_id, badge_id) makes re-runs safe.
 *
 * @param {string} volunteerId
 * @returns {Promise<string[]>} codes awarded this run (may be empty)
 */
async function evaluateForVolunteer(volunteerId) {
  const { data: badges, error: badgesError } = await getSupabase()
    .from("badges")
    .select("id, code, criteria_type, threshold")
    .order("sort_order", { ascending: true });
  assertOk(badgesError);
  if (!badges?.length) return [];

  const attended = await signupsRepo.listAttendedByVolunteerId(volunteerId);
  const signupCount = attended.length;
  const hoursTotal = attended.reduce(
    (sum, row) => sum + (Number(row.hours_logged) || 0),
    0,
  );

  /** @type {string[]} */
  const awarded = [];

  for (const badge of badges) {
    let met = false;
    if (badge.criteria_type === "signup_count") {
      met = signupCount >= badge.threshold;
    } else if (badge.criteria_type === "hours") {
      met = hoursTotal >= badge.threshold;
    }
    if (!met) continue;

    const { error } = await getSupabase()
      .from("volunteer_badges")
      .insert({ volunteer_id: volunteerId, badge_id: badge.id });

    // 23505 = already awarded — ignore; other errors still throw via assertOk
    if (error?.code === "23505") continue;
    assertOk(error);
    awarded.push(badge.code);
  }

  return awarded;
}

module.exports = { evaluateForVolunteer };
