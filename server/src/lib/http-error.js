/**
 * Builds an error carrying the HTTP status `middleware/error-handler.js` formats from.
 *
 * There is deliberately no `code` field and no class: the status line is the only
 * machine-readable signal clients branch on (CONTEXT.md §29).
 *
 * @param {number} status
 * @param {string} message
 * @returns {Error & { status: number }}
 */
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

module.exports = { httpError };
