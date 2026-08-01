const { ApiError } = require("../../lib/api-error");
const { normaliseEmail } = require("../../lib/email");
const volunteerLinksRepo = require("../../data/volunteer-links.repo");

/**
 * Links the volunteer row for a verified email address to a profile.
 *
 * Called on a user's first authenticated request, so it must be cheap, idempotent,
 * and must never throw for the common case of "this person never volunteered".
 *
 * WHY EMAIL AND NOT THE ACCESS TOKEN. `volunteers.access_token` is a bearer
 * capability that arrives in a forwardable link. Letting it bind an arbitrary
 * Supabase account to a volunteer identity would be an account-takeover primitive —
 * whoever holds a forwarded link would inherit someone else's hours, badges and
 * contact details. The email comes from a Supabase-verified token instead.
 *
 * The caller is responsible for confirming `email_confirmed_at` before reaching
 * here. Without that check, signing up with a known volunteer's address is enough
 * to claim their history.
 *
 * @param {{ profileId: string, email: string }} options
 * @returns {Promise<{ linked: boolean, reason?: string, volunteer?: object }>}
 * @throws {ApiError} 409 when the row belongs to a different profile
 */
async function linkVolunteerToProfile({ profileId, email }) {
  const normalised = normaliseEmail(email);

  const claimed = await volunteerLinksRepo.claimByEmail({
    email: normalised,
    profileId,
  });

  if (claimed) {
    return { linked: true, volunteer: claimed };
  }

  // Zero rows updated means one of three things, and only a read can tell them apart.
  const existing = await volunteerLinksRepo.findByEmail(normalised);

  if (!existing) {
    return { linked: false, reason: "no_volunteer" };
  }

  if (existing.profile_id === profileId) {
    return { linked: true, volunteer: existing };
  }

  // Deliberately not logging the row's access_token — the schema forbids it appearing
  // in logs anywhere.
  throw ApiError.conflict("That volunteer record is already linked to another account");
}

module.exports = { linkVolunteerToProfile };
