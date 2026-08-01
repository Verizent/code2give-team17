const signupsRepo = require("../../data/volunteer-signups.repo");
const badgesService = require("./badges.service");

/**
 * Bulk mark-attendance write. For each signup row: patch `status`, `hours_logged`,
 * `attended_at`, then evaluate badge criteria (deduped per volunteer — a volunteer
 * with two signups in the same batch is evaluated once, not twice).
 *
 * @param {string} opportunityId Not written to signups (their FK is set at signup
 *   time) — used by the route layer for auditing/validation. Kept in the service
 *   signature so callers can be swapped later without touching the API.
 * @param {{ id: string, hours_logged: number, status: string }[]} signupPatches
 */
async function markAttendance(_opportunityId, signupPatches) {
  const attendedAt = new Date().toISOString();

  const updatedSignups = [];
  for (const patch of signupPatches) {
    const updated = await signupsRepo.markAttendance(patch.id, {
      hours_logged: patch.hours_logged,
      status: patch.status,
      attended_at: attendedAt,
    });
    updatedSignups.push(updated);
  }

  const uniqueVolunteerIds = [
    ...new Set(updatedSignups.map((row) => row.volunteer_id)),
  ];

  /** @type {Record<string, string[]>} */
  const awardedByVolunteer = {};
  for (const volunteerId of uniqueVolunteerIds) {
    const awarded = await badgesService.awardAfterAttendance(volunteerId);
    if (awarded.length > 0) {
      awardedByVolunteer[volunteerId] = awarded;
    }
  }

  return {
    signups: updatedSignups,
    awarded_badges_by_volunteer: awardedByVolunteer,
  };
}

module.exports = { markAttendance };
