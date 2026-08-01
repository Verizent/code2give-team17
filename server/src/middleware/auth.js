const { ApiError } = require("../lib/api-error");
const { getSupabase } = require("../config/supabase");
const profilesRepo = require("../data/profiles.repo");

/**
 * Verifies `Authorization: Bearer <jwt>` via Supabase Auth and sets `request.user`.
 */
async function requireAuth(request, _response, next) {
  try {
    const header = request.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthenticated();
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      throw ApiError.unauthenticated();
    }

    const { data, error } = await getSupabase().auth.getUser(token);
    if (error || !data?.user) {
      throw ApiError.unauthenticated("Invalid or expired session");
    }

    request.user = data.user;
    request.accessToken = token;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Attaches `request.user` when a valid Bearer token is present; otherwise continues
 * as a guest (`request.user` stays undefined).
 */
async function optionalAuth(request, _response, next) {
  try {
    const header = request.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      next();
      return;
    }

    const { data, error } = await getSupabase().auth.getUser(token);
    if (!error && data?.user) {
      request.user = data.user;
      request.accessToken = token;
    }
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Resolves the caller's role. Canonical source is `profiles.role` (§9).
 * If that table is not yet readable by service_role, falls back to
 * `auth.users.app_metadata.role` (service-role writable only — never signup).
 *
 * @param {{ id: string, email?: string, app_metadata?: { role?: string } }} user
 * @returns {Promise<{ id: string, role: string, email?: string | null, full_name?: string | null, locale?: string | null, phone?: string | null }>}
 */
async function resolveProfile(user) {
  const profile = await profilesRepo.findById(user.id);
  if (profile?.role) {
    return profile;
  }

  const metaRole = user.app_metadata?.role;
  if (metaRole === "admin" || metaRole === "volunteer") {
    return {
      id: user.id,
      role: metaRole,
      email: user.email ?? null,
      full_name: null,
      locale: null,
      phone: null,
    };
  }

  // Default for authenticated users with no profile row yet.
  return {
    id: user.id,
    role: "volunteer",
    email: user.email ?? null,
    full_name: null,
    locale: null,
    phone: null,
  };
}

/**
 * Must run after `requireAuth`. Loads `request.profile` and 403s unless `role`
 * is one of the allowed values. `role` is never taken from the request body.
 *
 * @param {...('admin' | 'volunteer')} roles
 */
function requireRole(...roles) {
  return async (request, _response, next) => {
    try {
      if (!request.user) {
        throw ApiError.unauthenticated();
      }

      const profile = await resolveProfile(request.user);
      request.profile = profile;

      if (!roles.includes(profile.role)) {
        throw ApiError.forbidden("Admin role required");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  resolveProfile,
};
