const { httpError } = require("../lib/http-error");

/**
 * Flattens a ZodError into the one-line field list `message` carries on a 400.
 *
 * @param {{ issues: Array<{ path: Array<string|number>, message: string }> }} error
 * @returns {string}
 */
function formatIssues(error) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

/**
 * Runs the supplied Zod schemas and hands the parsed output to the handler, so
 * coercion and defaults reach it rather than the raw strings a query string carries.
 *
 * Parsed query lands on `request.validatedQuery`, not `request.query`: in Express 5
 * `request.query` is a getter and assigning to it throws. Handlers in this codebase
 * read `request.validatedQuery`.
 *
 * @param {{ body?: import("zod").ZodType, query?: import("zod").ZodType, params?: import("zod").ZodType }} schemas
 */
function validate({ body, query, params } = {}) {
  return (request, response, next) => {
    try {
      if (params) {
        request.validatedParams = params.parse(request.params);
      }
      if (query) {
        request.validatedQuery = query.parse(request.query);
      }
      if (body) {
        request.body = body.parse(request.body);
      }
      next();
    } catch (error) {
      if (Array.isArray(error?.issues)) {
        next(httpError(400, formatIssues(error)));
        return;
      }
      next(error);
    }
  };
}

module.exports = { validate };
