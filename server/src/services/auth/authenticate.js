// DEMO-ONLY: any Supabase signup is auto-provisioned as role='volunteer' on its first
//            authenticated request. There is no approval, induction or safeguarding
//            gate — real version needs the §20.5 screening decision before a first
//            session, and an admin-invite flow instead of hand-run SQL (§19, §26).
const { ApiError } = require("../../lib/api-error");
const { normaliseEmail } = require("../../lib/email");
const profilesRepo = require("../../data/profiles.repo");
const verifyToken = require("./verify-token");
const volunteerLinkService = require("./volunteer-link.service");

const BEARER = /^bearer\s+(.+)$/i;

// DEMO-ONLY bypass knobs. See resolveAuth for the three-way gate.
const DEMO_BYPASS_HEADER = "x-demo-auth";
const DEMO_BYPASS_VALUE = "admin";

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
 * DEMO-ONLY: returns a frozen `request.auth` for the seeded admin when all three
 * of NODE_ENV=development, `DEMO_ADMIN_USER_ID`, and `X-Demo-Auth: admin` are
 * present. Returns `null` in every other case so `resolveAuth` falls through to
 * normal Bearer verification.
 *
 * @param {object} request
 * @returns {Promise<object | null>}
 * @throws {ApiError} 500 when the env points at a UUID that has no profile row
 */
async function tryDemoBypass(request) {
  const demoUserId = process.env.DEMO_ADMIN_USER_ID;
  if (!demoUserId || process.env.NODE_ENV !== "development") {
    return null;
  }
  if (request.headers?.[DEMO_BYPASS_HEADER] !== DEMO_BYPASS_VALUE) {
    return null;
  }

  const profile = await profilesRepo.findById(demoUserId);
  if (!profile) {
    throw new ApiError(500, `DEMO_ADMIN_USER_ID ${demoUserId} not found in profiles`);
  }

  request.auth = Object.freeze({
    userId: profile.id,
    email: profile.email,
    role: profile.role,
    profile,
  });

  return request.auth;
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

  // DEMO-ONLY: env-gated + dev-gated + header-opt-in identity swap. Three refusals
  // (env, NODE_ENV, header) so a stray env in a deployed environment cannot open
  // the door. Distinct from the "single line that must never be improved" comment
  // below — that guards CLIENT-controlled metadata; this bypass is SERVER-controlled
  // and cross-referenced from §19 of the pre-prod checklist.
  const bypassed = await tryDemoBypass(request);
  if (bypassed) {
    return bypassed;
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
      // NOT NULL, and constrained to lower(btrim(...)). `handle_new_user` coalesces
      // a missing address to '' rather than failing the insert; match it, because a
      // phone-auth account with no email must still get a profile.
      email: verified.email ? normaliseEmail(verified.email) : "",
      full_name: verified.fullName,
      locale: "en",
    });
  }

  // Deliberately NOT tied to first provision. `on_auth_user_created` inserts the
  // profiles row at signup, so the branch above almost never runs — gating the link
  // on it meant the link never ran for anybody, silently.
  //
  // The token cache is the throttle instead: at most one attempt per token per TTL,
  // rather than one on every authenticated request. Note that is per TTL and not per
  // account — a signed-in tab re-attempts this once a minute indefinitely, which is
  // why `linkVolunteerToProfile` reads before it writes and costs a single SELECT
  // once the link is settled either way.
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
