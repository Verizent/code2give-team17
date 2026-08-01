const express = require("express");
// One line per domain, kept alphabetical: routes/index.js is where all six tracks
// collide, and an alphabetical list merges more cleanly than an ad-hoc one.
const adminRoutes = require("./admin");
const articlesRoutes = require("./articles.routes");
const communityPostsRoutes = require("./community-posts.routes");
const healthRoutes = require("./health.routes");
const impactRoutes = require("./impact.routes");

const router = express.Router();

router.get("/api", (request, response) => {
  response.json({
    message: "Code2Give Team 17 API",
    status: "running",
  });
});

// One mount for every admin surface. The requireRole('admin') guard lives in
// ./admin/index.js so a new admin router inherits it by construction.
router.use("/api/admin", adminRoutes);
router.use("/api/articles", articlesRoutes);
router.use("/api/community-posts", communityPostsRoutes);
router.use("/api/health", healthRoutes);
router.use("/api/impact", impactRoutes);

module.exports = router;
