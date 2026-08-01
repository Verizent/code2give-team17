const authenticate = require("../services/auth/authenticate");

/**
 * Requires any authenticated caller. Leaves `request.auth` populated.
 *
 * @type {import("express").RequestHandler}
 */
async function requireAuth(request, response, next) {
  try {
    await authenticate.resolveAuth(request);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Populates `request.auth` when a usable token is present, and does nothing when it
 * is not.
 *
 * The swallow is deliberate: on a route that is public but personalises when signed
 * in, a stale or expired token must not break the page for a visitor who could have
 * seen it anonymously.
 *
 * @type {import("express").RequestHandler}
 */
async function optionalAuth(request, response, next) {
  try {
    await authenticate.resolveAuth(request);
  } catch {
    // Intentionally ignored — see above.
  }

  next();
}

module.exports = { requireAuth, optionalAuth };
