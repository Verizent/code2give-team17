const { codeForStatus, labelForStatus } = require("../lib/api-error");

/**
 * Formats every error into the CONTEXT.md §29 envelope: `{ error, message, code }`.
 *
 * - `error` is the HTTP status label, derived from the status rather than hardcoded, so a 404
 *   no longer reports itself as an Internal Server Error.
 * - `message` is human-facing detail, omitted entirely when NODE_ENV=production so stack
 *   details and driver strings never reach a response.
 * - `code` is the only field a client may branch on, and the only one surviving the production
 *   suppression above. That is the whole reason it exists.
 *
 * @type {import("express").ErrorRequestHandler}
 */
function errorHandler(error, request, response, next) {
  console.error(error);

  if (response.headersSent) {
    next(error);
    return;
  }

  const status = error.status || 500;

  /** @type {{ error: string, code: string, message?: string }} */
  const body = {
    error: labelForStatus(status),
    code: error.code || codeForStatus(status),
  };

  if (process.env.NODE_ENV !== "production") {
    body.message = error.message;
  }

  response.status(status).json(body);
}

module.exports = errorHandler;
