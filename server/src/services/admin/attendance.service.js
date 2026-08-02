const signupsRepo = require("../../data/volunteer-signups.repo");
const opportunitiesRepo = require("../../data/volunteer-opportunities.repo");
const badgesService = require("./badges.service");
const thankYouService = require("../email/thank-you.service");

/**
 * Bulk mark-attendance write. For each signup row: patch `status`, `hours_logged`,
 * `attended_at`, then evaluate badge criteria (deduped per volunteer — a volunteer
 * with two signups in the same batch is evaluated once, not twice), then send the
 * thank-you email (per signup, guarded by `thank_you_email_sent_at` so a second
 * attendance-mark cannot re-send).
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

  const thankYouSent = await sendThankYouEmails(updatedSignups);

  return {
    signups: updatedSignups,
    awarded_badges_by_volunteer: awardedByVolunteer,
    thank_you_emails_sent: thankYouSent,
  };
}

/**
 * Fires the thank-you email for each attended signup that has not already been
 * thanked. A send failure is logged and swallowed — the badge award and
 * attendance write must not be undone by an email outage. The `thank_you_email_
 * sent_at` stamp lands only on success, so a retry later still works.
 *
 * @param {object[]} updatedSignups
 * @returns {Promise<number>} count actually sent
 */
async function sendThankYouEmails(updatedSignups) {
  let sent = 0;

  for (const signup of updatedSignups) {
    if (signup.status !== "attended") {
      continue;
    }
    if (signup.thank_you_email_sent_at) {
      continue;
    }

    const volunteer = signup.volunteers;
    const opportunity = signup.volunteer_opportunities;
    if (!volunteer || !opportunity) {
      continue;
    }

    let recommendations = [];
    try {
      const { rows } = await opportunitiesRepo.listOpen({
        from: 0,
        to: 3,
        programme: opportunity.programme,
      });
      recommendations = (rows || [])
        .filter((row) => row.id !== opportunity.id)
        .slice(0, 3);
    } catch (error) {
      console.error(
        `attendance thank-you: recommendation lookup failed for signup ${signup.id}: ${error.message}`,
      );
    }

    try {
      await thankYouService.sendThankYou({
        volunteer,
        signup,
        opportunity,
        recommendations,
      });
      await signupsRepo.markThankYouSent(signup.id, new Date().toISOString());
      sent += 1;
    } catch (error) {
      console.error(
        `attendance thank-you: send failed for signup ${signup.id}: ${error.message}`,
      );
    }
  }

  return sent;
}

module.exports = { markAttendance };
