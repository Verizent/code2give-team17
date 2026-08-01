const express = require("express");
// One line per domain, kept alphabetical: routes/index.js is where all six tracks
// collide, and an alphabetical list merges more cleanly than an ad-hoc one.
const requireAuth = require("../middleware/require-auth");
const requireRole = require("../middleware/require-role");

const adminArticlesRoutes = require("./admin/articles.routes");
const adminCommunityPostsRoutes = require("./admin/community-posts.routes");
const adminImpactRoutes = require("./admin/impact.routes");
const adminInstagramRoutes = require("./admin/instagram.routes");
const adminSessionsRoutes = require("./admin/sessions.routes");
const articlesRoutes = require("./articles.routes");
const communityPostsRoutes = require("./community-posts.routes");
const healthRoutes = require("./health.routes");
const impactRoutes = require("./impact.routes");
const instagramRoutes = require("./instagram.routes");

const router = express.Router();

router.get("/api", (request, response) => {
  response.json({
    message: "Code2Give Team 17 API",
    status: "running",
  });
});

// Admin routes — all protected by auth + role stubs
const adminGuard = [requireAuth, requireRole("admin")];
router.use("/api/admin/articles", adminGuard, adminArticlesRoutes);
router.use("/api/admin/community-posts", adminGuard, adminCommunityPostsRoutes);
router.use("/api/admin/impact", adminGuard, adminImpactRoutes);
router.use("/api/admin/instagram", adminGuard, adminInstagramRoutes);
router.use("/api/admin/sessions", adminGuard, adminSessionsRoutes);

// Public routes
router.use("/api/articles", articlesRoutes);
router.use("/api/community-posts", communityPostsRoutes);
router.use("/api/health", healthRoutes);
router.use("/api/impact", impactRoutes);
router.use("/api/instagram", instagramRoutes);

module.exports = router;
