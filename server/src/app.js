const express = require("express");
const apiRoutes = require("./routes");
const uploadsRoutes = require("./routes/uploads.routes");
const webhooksRoutes = require("./routes/webhooks.routes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.disable("x-powered-by");

// MUST stay above express.json(). Stripe signs the exact bytes it sent, so a body that has
// been parsed and re-stringified fails verification on a perfectly valid signature
// (CONTEXT.md §17). The route mounts express.raw() itself; this line is what stops the JSON
// parser consuming the stream first.
app.use("/api/webhooks/stripe", webhooksRoutes);

// CORS runs before the body parsers, not after, because the photo upload below also has
// to sit above express.json() and still needs these headers plus the OPTIONS
// short-circuit — a raw-body route mounted above the old position got neither.
app.use((request, response, next) => {
  response.set({
    "Access-Control-Allow-Origin": CLIENT_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Volunteer-Token, X-Stub-User-Id, X-Stub-Role",
  });

  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }

  next();
});

// Same ordering constraint as the Stripe webhook: this route reads an image as a raw
// Buffer, so express.json() must not consume the stream first.
app.use("/api/uploads", uploadsRoutes);

app.use(express.json());

app.get("/", (request, response) => {
  response.json({
    message: "Code2Give Team 17 API",
    status: "running",
  });
});

app.use(apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
