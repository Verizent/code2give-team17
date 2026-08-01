function notFound(request, response) {
  response.status(404).json({
    error: "Not Found",
    message: `No route exists for ${request.method} ${request.originalUrl}`,
  });
}

module.exports = notFound;
