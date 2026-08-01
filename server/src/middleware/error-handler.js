const { codeForStatus } = require("../lib/api-error");

function errorHandler(error, request, response, next) {
  console.error(error);

  if (response.headersSent) {
    next(error);
    return;
  }

  const status = error.status || 500;

  response.status(status).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" ? undefined : error.message,
    // CONTEXT.md §29: `code` is the only field a client may branch on, so unlike
    // `message` it is never suppressed - in production it is all the body carries.
    code: error.code || codeForStatus(status),
  });
}

module.exports = errorHandler;
