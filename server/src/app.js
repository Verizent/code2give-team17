const express = require("express");
const apiRoutes = require("./routes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.disable("x-powered-by");
app.use(express.json());

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
