const { STATUS_CODES } = require("node:http");

/**
 * Formats every error reaching the API boundary as the CONTEXT.md §29 envelope:
 * `{ error, message }`, where `error` is the HTTP status label.
 *
 * Clients branch on the **HTTP status**, never on the body — `message` is prose and
 * will be reworded. Throw an error carrying a `.status` property and let this format
 * it; building a response by hand in a route is how the envelope drifts.
 *
 * `message` is suppressed for 5xx in production so stack details and driver strings
 * never ship. It survives on 4xx, which are messages we wrote deliberately and which
 * a form has to be able to show.
 *
 * @param {Error & { status?: number }} error
 */
function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  const status = error.status || 500;
  const isServerError = status >= 500;

  // Only 5xx is logged. A 404 and a validation 400 are routine traffic, and once
  // form validation and slug probing land, logging them would bury a teammate's own
  // output under a wall of this track's noise.
  if (isServerError) {
    console.error(error);
  }

  const hideMessage = isServerError && process.env.NODE_ENV === "production";

  response.status(status).json({
    error: STATUS_CODES[status] || "Internal Server Error",
    message: hideMessage ? undefined : error.message,
  });
}

module.exports = errorHandler;
