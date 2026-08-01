const crypto = require("node:crypto");
const { getServiceClient } = require("../../config/supabase");
const { ApiError } = require("../../lib/api-error");

/**
 * THE SWAP SEAM. Nothing else in the codebase knows how a token is checked, so
 * moving to local JWKS verification later is a rewrite of this file alone.
 *
 * We call Supabase rather than verifying HS256 locally because local verification
 * needs SUPABASE_JWT_SECRET in six people's untracked .env files, and the failure
 * mode when a teammate misses it is that every authenticated request 401s with an
 * error that says nothing about a missing secret. This route adds zero dependencies
 * and zero environment variables.
 */

const CACHE_TTL_MS = 60_000;
const CACHE_MAX_ENTRIES = 500;
const VERIFY_TIMEOUT_MS = 5000;

/** @type {Map<string, { expiresAt: number, value: object }>} */
const cache = new Map();

function cacheKey(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function readCache(key) {
  const hit = cache.get(key);

  if (!hit) {
    return null;
  }

  if (hit.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return hit.value;
}

function writeCache(key, value) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // Oldest-first eviction: Map iterates in insertion order.
    cache.delete(cache.keys().next().value);
  }

  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
}

/**
 * A failed auth call is 401 only when Supabase actually rejected the token.
 * A network failure means we cannot tell, and answering 401 would log everyone out
 * because the auth provider blinked. `config/supabase.js` already uses 503 for
 * exactly this class of failure.
 *
 * @param {{ status?: number } | null} error
 */
function classify(error) {
  const status = error?.status;

  if (typeof status === "number" && status >= 400 && status < 500) {
    return ApiError.unauthenticated();
  }

  return new ApiError(503, "Authentication provider is unreachable");
}

/**
 * Verifies a Supabase access token and returns only the fields we trust.
 *
 * `userMetadata` is returned deliberately un-trusted: it is echoed so callers can
 * read a display name from it, and it must never influence a role. See
 * `authenticate.js`.
 *
 * @param {string} token
 * @returns {Promise<{ userId: string, email: string|null, emailConfirmedAt: string|null,
 *   fullName: string|null, userMetadata: object }>}
 * @throws {ApiError} 401 when rejected, 503 when Supabase is unreachable
 */
async function verifySupabaseToken(token) {
  const key = cacheKey(token);
  const cached = readCache(key);

  if (cached) {
    return cached;
  }

  let result;

  try {
    result = await Promise.race([
      getServiceClient().auth.getUser(token),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new ApiError(503, "Authentication provider timed out")),
          VERIFY_TIMEOUT_MS,
        ).unref(),
      ),
    ]);
  } catch (error) {
    // Never forward a raw Supabase error: AuthApiError carries code "bad_jwt",
    // which error-handler.js would ship straight into the response envelope in
    // place of a §29 code.
    throw error instanceof ApiError ? error : classify(error);
  }

  const { data, error } = result;

  if (error) {
    throw classify(error);
  }

  const user = data?.user;

  // getUser resolves { user: null, error: null } for a revoked token. Checking only
  // `error` would let a revoked token straight through.
  if (!user?.id) {
    throw ApiError.unauthenticated();
  }

  const value = {
    userId: user.id,
    email: user.email ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
    fullName: user.user_metadata?.full_name ?? null,
    userMetadata: user.user_metadata ?? {},
  };

  writeCache(key, value);

  return value;
}

module.exports = { verifySupabaseToken };
