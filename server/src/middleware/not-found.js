const { ApiError } = require("../lib/api-error");

/**
 * Terminal 404. Delegates to the error handler rather than formatting a response itself, so the
 * §29 envelope has exactly one producer — including the `code` field, which the direct response
 * here previously omitted.
 *
 * @type {import("express").RequestHandler}
 */
function notFound(request, response, next) {
  next(
    ApiError.notFound(
      `No route exists for ${request.method} ${request.originalUrl}`,
    ),
  );
}

module.exports = notFound;
