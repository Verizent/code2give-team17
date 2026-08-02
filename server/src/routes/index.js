const express = require("express");
const { requireAuth } = require("../middleware/require-auth");
const { requireRole } = require("../middleware/require-role");
// One line per domain, kept alphabetical: routes/index.js is where all six tracks
// collide, and an alphabetical list merges more cleanly than an ad-hoc one.
const adminAttendanceRoutes = require("./admin/attendance.routes");
const adminCampaignsRoutes = require("./admin.routes");
const adminCommunityPostsRoutes = require("./admin/community-posts.routes");
const adminHandsonRoutes = require("./admin/handson.routes");
const adminPostingsRoutes = require("./admin/postings.routes");
const articlesRoutes = require("./articles.routes");
const campaignsRoutes = require("./campaigns.routes");
const communityPostsRoutes = require("./community-posts.routes");
const donationsRoutes = require("./donations.routes");
const donorsRoutes = require("./donors.routes");
const emailVerificationsRoutes = require("./email-verifications.routes");
const healthRoutes = require("./health.routes");
const impactRoutes = require("./impact.routes");
const meRoutes = require("./me.routes");
const opportunitiesRoutes = require("./opportunities.routes");
const volunteerRoutes = require("./volunteer.routes");
const volunteerSignupsRoutes = require("./volunteer-signups.routes");
const volunteersRoutes = require("./volunteers.routes");
const wishlistRoutes = require("./wishlist.routes");

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

router.use("/api/admin/attendance", adminGuard, adminAttendanceRoutes);
router.use("/api/admin/community-posts", adminGuard, adminCommunityPostsRoutes);
router.use("/api/admin/handson", adminGuard, adminHandsonRoutes);
router.use("/api/admin/postings", adminGuard, adminPostingsRoutes);
// Out of alphabetical order on purpose: this one is a bare "/api/admin" prefix, so it
// matches everything the four specific mounts above match. Express would still fall
// through to them (a sub-router that has no matching route calls next()), but reading
// it last matches the order requests actually resolve in.
//
// It arrived from the donations track with NO guard at all and a comment deferring
// auth to merge time. That covered nine endpoints including GET /api/admin/donors,
// which lists donor emails, and POST /api/admin/cron/close-periods, which mutates
// financial state. The guard is applied here rather than inside admin.routes.js so
// every admin surface is gated in one readable place.
router.use("/api/admin", adminGuard, adminCampaignsRoutes);
router.use("/api/articles", articlesRoutes);
router.use("/api/campaigns", campaignsRoutes);
router.use("/api/community-posts", communityPostsRoutes);
router.use("/api/donations", donationsRoutes);
router.use("/api/donors", donorsRoutes);
router.use("/api/email-verifications", emailVerificationsRoutes);
router.use("/api/health", healthRoutes);
router.use("/api/impact", impactRoutes);
router.use("/api/me", meRoutes);
router.use("/api/opportunities", opportunitiesRoutes);
router.use("/api/volunteer", volunteerRoutes);
router.use("/api/volunteer-signups", volunteerSignupsRoutes);
router.use("/api/volunteers", volunteersRoutes);
router.use("/api/wishlist", wishlistRoutes);

module.exports = router;
