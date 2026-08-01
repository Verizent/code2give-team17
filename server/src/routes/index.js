const express = require("express");
const { requireAuth } = require("../middleware/require-auth");
const { requireRole } = require("../middleware/require-role");
// One line per domain, kept alphabetical: routes/index.js is where all six tracks
// collide, and an alphabetical list merges more cleanly than an ad-hoc one.
const adminCommunityPostsRoutes = require("./admin/community-posts.routes");
const articlesRoutes = require("./articles.routes");
const communityPostsRoutes = require("./community-posts.routes");
const healthRoutes = require("./health.routes");
const impactRoutes = require("./impact.routes");
const meRoutes = require("./me.routes");

const router = express.Router();

// Applied to every /api/admin mount below. requireAuth runs first so requireRole is
// never deciding on a role nothing has established — though requireRole resolves
// auth itself too, so mounting it alone still refuses correctly rather than reading
// an absent role and defaulting.
//
// tests/routes/admin-mount.test.js fails if any admin mount omits this.
const adminGuard = [requireAuth, requireRole("admin")];

router.get("/api", (request, response) => {
  response.json({
    message: "Code2Give Team 17 API",
    status: "running",
  });
});

router.use("/api/admin/community-posts", adminGuard, adminCommunityPostsRoutes);
router.use("/api/articles", articlesRoutes);
router.use("/api/community-posts", communityPostsRoutes);
router.use("/api/health", healthRoutes);
router.use("/api/impact", impactRoutes);
router.use("/api/me", meRoutes);

module.exports = router;
