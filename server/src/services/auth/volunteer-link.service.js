const { ApiError } = require("../../lib/api-error");
const { normaliseEmail } = require("../../lib/email");
const volunteerLinksRepo = require("../../data/volunteer-links.repo");

/**
 * Links the volunteer row for a verified email address to a profile.
 *
 * Called on every token-cache miss, NOT once per account, so it must be cheap,
 * idempotent, and must never throw for the common case of "this person never
 * volunteered".
 *
 * READ BEFORE WRITE, deliberately. `authenticate.js` re-attempts this whenever the
 * 60s token cache expires, so for anyone who keeps a tab open it runs once a minute
 * for as long as they stay signed in. Claiming first meant three of the four
 * outcomes — never volunteered, already ours, already someone else's — each paid for
 * an UPDATE that could only ever match zero rows before the SELECT that actually
 * decided the answer. All three are now a single SELECT.
 *
 * The cost is one extra round trip on a genuine first claim, which happens once per
 * volunteer ever. That is the right side of the trade.
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

  const existing = await volunteerLinksRepo.findByEmail(normalised);

  if (!existing) {
    return { linked: false, reason: "no_volunteer" };
  }

  if (existing.profile_id === profileId) {
    return { linked: true, volunteer: existing };
  }

  if (existing.profile_id) {
    // Deliberately not logging the row's access_token — the schema forbids it
    // appearing in logs anywhere.
    throw ApiError.conflict("That volunteer record is already linked to another account");
  }

  const claimed = await volunteerLinksRepo.claimByEmail({
    email: normalised,
    profileId,
  });

  if (claimed) {
    return { linked: true, volunteer: claimed };
  }

  // The read above said unclaimed, so zero rows updated can now only mean a
  // concurrent claim won the race. `.is("profile_id", null)` inside claimByEmail is
  // still the guard that makes that safe — reading first narrows the window, it does
  // not remove it, so this branch must stay.
  throw ApiError.conflict("That volunteer record is already linked to another account");
}

module.exports = { linkVolunteerToProfile };
