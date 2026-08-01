// DEMO-ONLY: any Supabase signup is auto-provisioned as role='volunteer' on its first
//            authenticated request. There is no approval, induction or safeguarding
//            gate — real version needs the §20.5 screening decision before a first
//            session, and an admin-invite flow instead of hand-run SQL (§19, §26).
const { ApiError } = require("../../lib/api-error");
const profilesRepo = require("../../data/profiles.repo");
const verifyToken = require("./verify-token");
const volunteerLinkService = require("./volunteer-link.service");

const BEARER = /^bearer\s+(.+)$/i;

/**
 * @param {{ headers: Record<string, string> }} request
 * @returns {string}
 * @throws {ApiError} 401
 */
function readBearerToken(request) {
  const match = BEARER.exec(request.headers?.authorization ?? "");

  if (!match) {
    throw ApiError.unauthenticated();
  }

  return match[1].trim();
}

/**
 * Resolves the caller's identity and caches it on the request.
 *
 * Idempotent by design: `requireAuth` and `requireRole` both call it, and the second
 * call is a no-op. That is what lets `requireRole` be self-sufficient rather than
 * assuming `requireAuth` was mounted first — a route that forgot the first
 * middleware would otherwise read `undefined.role`, and the defensive fix for that
 * is an admin route which is silently wide open.
 *
 * @param {object} request
 * @returns {Promise<{ userId: string, email: string|null, role: string, profile: object }>}
 * @throws {ApiError} 401 unauthenticated, 503 auth provider unreachable
 */
async function resolveAuth(request) {
  if (request.auth) {
    return request.auth;
  }

  const token = readBearerToken(request);
  const verified = await verifyToken.verifySupabaseToken(token);

  let profile = await profilesRepo.findById(verified.userId);

  if (!profile) {
    // role is NOT taken from verified.userMetadata. Supabase lets any client pass
    // arbitrary metadata to signUp(), so reading a role from it would make admin
    // self-serve. This is the single line that must never be "improved".
    profile = await profilesRepo.insertIfAbsent({
      id: verified.userId,
      full_name: verified.fullName,
      locale: "en",
    });
  }

  // Deliberately NOT tied to first provision. `on_auth_user_created` inserts the
  // profiles row at signup, so the branch above almost never runs — gating the link
  // on it meant the link never ran for anybody, silently.
  //
  // The token cache is the throttle instead: at most one attempt per token per TTL,
  // rather than a claim UPDATE on every authenticated request.
  if (!verified.fromCache) {
    await linkVolunteerIfProven(verified);
  }

  request.auth = Object.freeze({
    userId: verified.userId,
    email: verified.email,
    // Read from the profile row and nowhere else.
    role: profile.role,
    profile,
  });

  return request.auth;
}

/**
 * Links an existing volunteer record on first provision, when — and only when —
 * Supabase has confirmed the address.
 *
 * Without the confirmation check, signing up with a known volunteer's email address
 * is enough to inherit their hours, badges and contact details. `volunteers.
 * email_verified_at` cannot stand in for this: the feature that wrote it was
 * removed, so it is null on every row.
 *
 * A failure here never blocks authentication — an admin whose address collides with
 * a claimed volunteer row must still be able to log in and moderate.
 *
 * @param {{ userId: string, email: string|null, emailConfirmedAt: string|null }} verified
 */
async function linkVolunteerIfProven(verified) {
  if (!verified.emailConfirmedAt || !verified.email) {
    return;
  }

  try {
    await volunteerLinkService.linkVolunteerToProfile({
      profileId: verified.userId,
      email: verified.email,
    });
  } catch {
    // 409 (row belongs to someone else) and any transient failure are both
    // non-fatal here. The volunteer simply stays unlinked.
  }
}

module.exports = { resolveAuth };
