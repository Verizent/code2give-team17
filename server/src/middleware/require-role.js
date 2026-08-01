const { ApiError } = require("../lib/api-error");
const authenticate = require("../services/auth/authenticate");

/**
 * Requires an authenticated caller holding one of the given roles.
 *
 * SELF-SUFFICIENT ON PURPOSE. This resolves auth itself instead of assuming
 * `requireAuth` was mounted ahead of it. Mounted alone it still refuses correctly;
 * mounted after `requireAuth` the second resolve is a cached no-op. The alternative
 * — trusting a `request.auth` that a forgotten middleware never set — leads to
 * `if (request.auth && !allowed.has(request.auth.role))`, which reads like a guard
 * and behaves like an open door.
 *
 * @param {...string} roles
 * @returns {import("express").RequestHandler}
 */
function requireRole(...roles) {
  const allowed = new Set(roles);

  return async function requireRoleMiddleware(request, response, next) {
    try {
      const auth = await authenticate.resolveAuth(request);

      // No membership test can pass on an absent role: `allowed` never contains
      // undefined, so a profile missing its role is refused rather than defaulted.
      if (!allowed.has(auth.role)) {
        next(ApiError.forbidden());
        return;
      }

      next();
    } catch (error) {
      // A missing or invalid token surfaces as 401 from resolveAuth. Answering 403
      // instead would tell an anonymous caller that the route exists and they are
      // merely the wrong role.
      next(error);
    }
  };
}

module.exports = { requireRole };
