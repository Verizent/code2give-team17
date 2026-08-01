const { httpError } = require("../lib/http-error");

/**
 * Turns a PostgREST error into a 500 carrying the driver message.
 *
 * The message never reaches a production client — `error-handler.js` suppresses it
 * on 5xx — so it can stay specific enough to debug from a local log.
 *
 * @param {{ message?: string } | null} error
 */
function assertOk(error) {
  if (error) {
    throw httpError(500, `Database query failed: ${error.message ?? "unknown error"}`);
  }
}

module.exports = { assertOk };
