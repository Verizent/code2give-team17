const { ApiError } = require("../lib/api-error");

/**
 * Turns a PostgREST error into a 500 carrying the driver message.
 *
 * The message never reaches a production client — `error-handler.js` suppresses it
 * outside development — so it can stay specific enough to debug from a local log.
 *
 * @param {{ message?: string } | null} error
 */
function assertOk(error) {
  if (error) {
    throw new ApiError(500, `Database query failed: ${error.message ?? "unknown error"}`);
  }
}

// `throwIfDbError` is the volunteer-track name for the same helper — kept as an alias
// so volunteer repos merged in from feature/volunteers-backend/... keep working
// without renaming every call site.
module.exports = { assertOk, throwIfDbError: assertOk };
