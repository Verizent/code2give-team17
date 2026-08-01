const { normaliseEmail } = require("../../lib/email");
const volunteerLinksRepo = require("../../data/volunteer-links.repo");

/** Shared because it is frozen and never mutated — every unlinked caller gets this. */
const UNLINKED = Object.freeze({ linked: false });

/**
 * Reports the volunteer record bound to this account, if there is one.
 *
 * The `profile_id` check is not redundant with the email lookup. Email alone would
 * hand the caller a row that belongs to somebody else — their name and claim date —
 * whenever an address appears in `volunteers` without having been claimed by this
 * profile. Only a row that already points back at us is ours to report.
 *
 * @param {{ userId: string, email: string|null }} auth
 * @returns {Promise<{ linked: boolean, id?: string, fullName?: string|null, claimedAt?: string|null }>}
 */
async function readVolunteerLink(auth) {
  // normaliseEmail throws on a null address, and a lookup for one could only match
  // nothing. An account without an email is unlinked, not an error.
  if (!auth.email) {
    return UNLINKED;
  }

  const row = await volunteerLinksRepo.findByEmail(normaliseEmail(auth.email));

  if (!row || row.profile_id !== auth.userId) {
    return UNLINKED;
  }

  return {
    linked: true,
    id: row.id,
    fullName: row.full_name ?? null,
    claimedAt: row.claimed_at ?? null,
  };
}

/**
 * Describes the caller to themselves.
 *
 * This exists because `role` is deliberately absent from the JWT — it is read from
 * the `profiles` row so that nothing a client can set may influence it. The cost of
 * that decision is that a signed-in browser has no other way to learn its own role,
 * and therefore no way to decide whether to render an admin surface.
 *
 * Built field by field rather than by spreading rows: `volunteers` carries
 * `access_token`, a bearer capability that must never reach a response body.
 *
 * @param {{ userId: string, email: string|null, role: string, profile: object }} auth
 *   the frozen object `resolveAuth` placed on the request
 * @returns {Promise<{ userId: string, email: string|null, role: string,
 *   fullName: string|null, locale: string, volunteer: object }>}
 */
async function getMe(auth) {
  return {
    userId: auth.userId,
    email: auth.email,
    role: auth.role,
    fullName: auth.profile.full_name ?? null,
    locale: auth.profile.locale ?? "en",
    volunteer: await readVolunteerLink(auth),
  };
}

module.exports = { getMe };
