const { ApiError } = require("../lib/api-error");

/**
 * @param {string} role
 * @returns {import("express").RequestHandler}
 */
function requireRole(role) {
  return (request, _response, next) => {
    if (!request.auth) {
      next(ApiError.unauthenticated());
      return;
    }

    if (request.auth.role !== role) {
      next(ApiError.forbidden());
      return;
    }

    next();
  };
}

module.exports = requireRole;
