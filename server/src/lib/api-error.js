const { STATUS_CODES } = require("node:http");

/**
 * The closed set of machine-readable error codes from CONTEXT.md §29.
 * Adding one is a contract change: add it to §29 first, then here.
 *
 * @type {Record<number, string>}
 */
const CODE_BY_STATUS = {
  400: "VALIDATION_FAILED",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMITED",
  500: "INTERNAL",
};

/**
 * Maps an HTTP status onto its §29 `code`. Unlisted statuses fall back by class, so a route
 * throwing an unusual status still produces a code a client can branch on.
 *
 * @param {number} status
 * @returns {string}
 */
function codeForStatus(status) {
  if (CODE_BY_STATUS[status]) {
    return CODE_BY_STATUS[status];
  }

  return status >= 400 && status < 500 ? "VALIDATION_FAILED" : "INTERNAL";
}

/**
 * Maps an HTTP status onto its label, which §29 fixes as the `error` field.
 *
 * @param {number} status
 * @returns {string}
 */
function labelForStatus(status) {
  return STATUS_CODES[status] || "Internal Server Error";
}

/**
 * The error every route and service should throw. §11: routes must not call
 * `response.status(...).json(...)` themselves — two places formatting errors is how the §29
 * envelope drifts, and a hand-rolled one forgets `code`, which is the field clients branch on.
 */
class ApiError extends Error {
  /**
   * @param {number} status HTTP status.
   * @param {string} message Human-facing detail. Suppressed entirely in production (§29).
   * @param {string} [code] Only pass this when two errors share a status and the client
   *   genuinely needs to tell them apart. Otherwise it is derived from the status.
   */
  constructor(status, message, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code || codeForStatus(status);
  }

  /** @param {string} [message] */
  static badRequest(message = "Request validation failed") {
    return new ApiError(400, message);
  }

  /** @param {string} [message] */
  static unauthenticated(message = "Authentication required") {
    return new ApiError(401, message);
  }

  /** @param {string} [message] */
  static forbidden(message = "You do not have permission to do that") {
    return new ApiError(403, message);
  }

  /** @param {string} [message] */
  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  /** @param {string} [message] */
  static conflict(message = "That resource already exists") {
    return new ApiError(409, message);
  }

  /** @param {string} [message] */
  static rateLimited(message = "Too many requests") {
    return new ApiError(429, message);
  }
}

module.exports = { ApiError, codeForStatus, labelForStatus, CODE_BY_STATUS };
