function notFound(request, response) {
  response.status(404).json({
    error: "Not Found",
    message: `No route exists for ${request.method} ${request.originalUrl}`,
    // CONTEXT.md §29 — the machine-readable field clients branch on.
    code: "NOT_FOUND",
  });
}

module.exports = notFound;

