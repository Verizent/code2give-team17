const { ApiError } = require("../lib/api-error");

/**
 * Postgres SQLSTATE codes PostgREST surfaces on `error.code`.
 *
 * Exported because the volunteer repos compare against them directly. Frozen: the
 * object is shared by every repo, and a stray write would silently change how another
 * track classifies its errors.
 *
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const PG = Object.freeze({
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  NOT_NULL_VIOLATION: "23502",
  CHECK_VIOLATION: "23514",
});

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

/**
 * The volunteer-track counterpart to `assertOk`, with one addition: a caller that
 * knows what a duplicate row *means* can pass `conflictMessage` and get a 409 the
 * form can display, instead of a 500 the user can do nothing about.
 *
 * It was previously aliased straight to `assertOk`, which silently dropped the
 * option four call sites were already passing.
 *
 * Without a `conflictMessage` a unique violation still 500s: there is nothing useful
 * to tell the user at that point, and synthesising a message here would leak column
 * names into the response.
 *
 * @param {{ code?: string, message?: string } | null} error
 * @param {{ conflictMessage?: string, conflictCode?: string }} [options]
 */
function throwIfDbError(error, options = {}) {
  if (!error) {
    return;
  }

  if (error.code === PG.UNIQUE_VIOLATION && options.conflictMessage) {
    throw new ApiError(409, options.conflictMessage, options.conflictCode);
  }

  assertOk(error);
}

module.exports = { assertOk, throwIfDbError, PG };
