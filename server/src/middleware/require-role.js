const { ApiError } = require("../lib/api-error");

/**
 * Express middleware factory — returns 403 if `req.user.role` is not the required role.
 * Must be placed after `requireAuth`.
 *
 * DEMO-ONLY: the auth stub sets role='admin' unconditionally, so this always passes.
 * Real version enforces actual JWT-derived role (§30, BE1 track).
 *
 * @param {string} role
 * @returns {import('express').RequestHandler}
 */
module.exports = function requireRole(role) {
  return function (req, res, next) {
    if (!req.user || req.user.role !== role) {
      return next(ApiError.forbidden());
    }
    next();
  };
};
