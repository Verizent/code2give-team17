const express = require("express");
// One line per domain, kept alphabetical: routes/index.js is where all six tracks
// collide, and an alphabetical list merges more cleanly than an ad-hoc one.
const articlesRoutes = require("./articles.routes");
const healthRoutes = require("./health.routes");
const impactRoutes = require("./impact.routes");

const router = express.Router();

router.get("/api", (request, response) => {
  response.json({
    message: "Code2Give Team 17 API",
    status: "running",
  });
});

router.use("/api/articles", articlesRoutes);
router.use("/api/health", healthRoutes);
router.use("/api/impact", impactRoutes);

module.exports = router;
