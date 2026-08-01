const express = require("express");
// One line per domain, kept alphabetical: routes/index.js is where all six tracks
// collide, and an alphabetical list merges more cleanly than an ad-hoc one.
const adminCampaignsRoutes = require("./admin.routes");
const adminCommunityPostsRoutes = require("./admin/community-posts.routes");
const articlesRoutes = require("./articles.routes");
const campaignsRoutes = require("./campaigns.routes");
const communityPostsRoutes = require("./community-posts.routes");
const donationsRoutes = require("./donations.routes");
const healthRoutes = require("./health.routes");
const impactRoutes = require("./impact.routes");
const wishlistRoutes = require("./wishlist.routes");

const router = express.Router();

router.get("/api", (request, response) => {
  response.json({
    message: "Code2Give Team 17 API",
    status: "running",
  });
});

router.use("/api/admin/community-posts", adminCommunityPostsRoutes);
router.use("/api/admin", adminCampaignsRoutes);
router.use("/api/articles", articlesRoutes);
router.use("/api/campaigns", campaignsRoutes);
router.use("/api/community-posts", communityPostsRoutes);
router.use("/api/donations", donationsRoutes);
router.use("/api/health", healthRoutes);
router.use("/api/impact", impactRoutes);
router.use("/api/wishlist", wishlistRoutes);

module.exports = router;
