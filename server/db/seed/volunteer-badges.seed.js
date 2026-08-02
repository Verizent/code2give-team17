// DEMO-ONLY: awards badges to already-seeded volunteers so the badge surfaces are not
// empty — real version awards them as attendance is genuinely marked (§23).
//
// This does NOT invent its own criteria. It calls the same
// `services/admin/badges.service.awardAfterAttendance` the attendance endpoint calls, so
// the seeded state is exactly what the running app would have produced from the same
// signup rows. A seed with its own scoring rules would drift from the real evaluator and
// make the demo show badges the product would never award.
//
// Idempotent: `awardAfterAttendance` reads already-earned badge ids before inserting, and
// `volunteer_badges` has a unique constraint on (volunteer_id, badge_id).

const { getSupabase } = require("../../src/config/supabase");
const { awardAfterAttendance } = require("../../src/services/admin/badges.service");

/**
 * Volunteers with at least one `attended` signup — the only ones the real evaluator
 * could ever award. Volunteers with no attendance are skipped rather than given a
 * participation badge they did not earn.
 *
 * @returns {Promise<string[]>} distinct volunteer ids
 */
async function volunteersWithAttendance() {
  const { data, error } = await getSupabase()
    .from("volunteer_signups")
    .select("volunteer_id")
    .eq("status", "attended");

  if (error) {
    throw new Error(`Reading attended signups failed: ${error.message}`);
  }

  return [...new Set((data ?? []).map((row) => row.volunteer_id).filter(Boolean))];
}

/**
 * Runs the real badge evaluator across every volunteer who has attended something.
 *
 * @returns {Promise<{ evaluated: number, awarded: number }>}
 */
async function awardDemoBadges() {
  const volunteerIds = await volunteersWithAttendance();
  let awarded = 0;

  for (const volunteerId of volunteerIds) {
    const result = await awardAfterAttendance(volunteerId);
    // awardAfterAttendance returns the newly-awarded rows; shape-tolerant so a change
    // to its return value degrades the count rather than throwing mid-seed.
    if (Array.isArray(result)) {
      awarded += result.length;
    } else if (Array.isArray(result?.awarded)) {
      awarded += result.awarded.length;
    }
  }

  return { evaluated: volunteerIds.length, awarded };
}

module.exports = { awardDemoBadges, volunteersWithAttendance };
