const { ApiError } = require("../lib/api-error");

/**
 * Attaches `request.auth` from a Supabase JWT or AUTH_MODE=stub headers.
 *
 * @type {import("express").RequestHandler}
 */
function requireAuth(request, _response, next) {
  const mode = process.env.AUTH_MODE || "stub";

  if (mode === "stub") {
    const userId = request.get("X-Stub-User-Id");
    const role = request.get("X-Stub-Role");

    if (!userId) {
      next(ApiError.unauthenticated());
      return;
    }

    request.auth = {
      userId,
      role: role || "volunteer",
    };
    request.user = { id: userId, email: request.get("X-Stub-User-Email") };
    next();
    return;
  }

  next(ApiError.unauthenticated("JWT authentication is not configured yet"));
}

/**
 * Continues as guest when no stub headers or JWT are present.
 *
 * @type {import("express").RequestHandler}
 */
function optionalAuth(request, _response, next) {
  const mode = process.env.AUTH_MODE || "stub";

  if (mode === "stub") {
    const userId = request.get("X-Stub-User-Id");
    if (userId) {
      request.auth = {
        userId,
        role: request.get("X-Stub-Role") || "volunteer",
      };
      request.user = { id: userId, email: request.get("X-Stub-User-Email") };
    }
    next();
    return;
  }

  next();
}

module.exports = requireAuth;
module.exports.optionalAuth = optionalAuth;
