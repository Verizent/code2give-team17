const { ApiError } = require("../lib/api-error");

const PG = {
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  CHECK_VIOLATION: "23514",
  NOT_NULL_VIOLATION: "23502",
};

/**
 * Maps a Supabase/Postgres driver error onto an ApiError.
 *
 * @param {unknown} error
 * @param {{ conflictMessage?: string, notFoundMessage?: string }} [options]
 */
function throwIfDbError(error, options = {}) {
  if (!error) {
    return;
  }

  const code = /** @type {{ code?: string }} */ (error).code;
  const message = /** @type {{ message?: string }} */ (error).message || "Database error";

  if (code === PG.UNIQUE_VIOLATION) {
    throw ApiError.conflict(options.conflictMessage || "That resource already exists");
  }

  if (code === PG.FOREIGN_KEY_VIOLATION) {
    throw ApiError.badRequest("Referenced resource does not exist");
  }

  if (code === PG.CHECK_VIOLATION || code === PG.NOT_NULL_VIOLATION) {
    throw ApiError.badRequest(message);
  }

  const wrapped = new Error(message);
  wrapped.status = 500;
  throw wrapped;
}

module.exports = { throwIfDbError, PG };
