/**
 * Errors that cross the API boundary, carrying the status and the machine-readable
 * `code` that CONTEXT.md §29 makes the contract.
 *
 * Throw one of these from a route or service; middleware/error-handler.js formats it.
 * Never build an error response by hand — two places formatting errors is how the
 * envelope drifts, and a hand-rolled one forgets `code`, which is the only field a
 * client is allowed to branch on.
 */

/** Status -> code, per the §29 table. The single source for the mapping. */
const CODE_BY_STATUS = {
  400: "VALIDATION_FAILED",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMITED",
};

const FALLBACK_CODE = "INTERNAL";

class ApiError extends Error {
  /**
   * @param {number} status HTTP status
   * @param {string} message human-facing detail — suppressed in production for 500s
   * @param {string} [code] override, only when two errors share a status and the client
   *   must tell them apart. Otherwise derived from `status`.
   */
  constructor(status, message, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code || codeForStatus(status);
  }
}

/** Resolve a status to its §29 code. Unmapped statuses are INTERNAL. */
function codeForStatus(status) {
  return CODE_BY_STATUS[status] || FALLBACK_CODE;
}

const badRequest = (message, code) => new ApiError(400, message, code);
const unauthenticated = (message) => new ApiError(401, message);
const forbidden = (message) => new ApiError(403, message);
const notFound = (message) => new ApiError(404, message);
const conflict = (message, code) => new ApiError(409, message, code);
const rateLimited = (message) => new ApiError(429, message);

module.exports = {
  ApiError,
  codeForStatus,
  badRequest,
  unauthenticated,
  forbidden,
  notFound,
  conflict,
  rateLimited,
};
