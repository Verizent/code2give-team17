const { ApiError } = require("../lib/api-error");

/**
 * Validates request segments with a Zod schema.
 *
 * @param {{ body?: import("zod").ZodType, query?: import("zod").ZodType, params?: import("zod").ZodType }} schemas
 * @returns {import("express").RequestHandler}
 */
function validate(schemas) {
  return (request, _response, next) => {
    try {
      if (schemas.params) {
        request.params = schemas.params.parse(request.params);
      }

      if (schemas.query) {
        request.query = schemas.query.parse(request.query);
      }

      if (schemas.body) {
        request.body = schemas.body.parse(request.body);
      }

      next();
    } catch (error) {
      if (error?.name === "ZodError") {
        next(ApiError.badRequest("Request validation failed"));
        return;
      }

      next(error);
    }
  };
}

module.exports = validate;
