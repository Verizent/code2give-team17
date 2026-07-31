function errorHandler(error, request, response, next) {
  console.error(error);

  if (response.headersSent) {
    next(error);
    return;
  }

  response.status(error.status || 500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
}

module.exports = errorHandler;
