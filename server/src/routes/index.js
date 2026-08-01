const express = require("express");
// One line per domain, kept alphabetical: routes/index.js is where all six tracks
// collide, and an alphabetical list merges more cleanly than an ad-hoc one.
const adminRoutes = require("./admin.routes");
const articlesRoutes = require("./articles.routes");
const authRoutes = require("./auth.routes");
const campaignsRoutes = require("./campaigns.routes");
const donationsRoutes = require("./donations.routes");
const donorsRoutes = require("./donors.routes");
const healthRoutes = require("./health.routes");
const impactRoutes = require("./impact.routes");
const meRoutes = require("./me.routes");
const opportunitiesRoutes = require("./opportunities.routes");
const volunteerRoutes = require("./volunteer.routes");

const router = express.Router();

router.get("/api", (request, response) => {
  response.json({
    message: "Code2Give Team 17 API",
    status: "running",
  });
});

router.use("/api/admin", adminRoutes);
router.use("/api/articles", articlesRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/campaigns", campaignsRoutes);
router.use("/api/donations", donationsRoutes);
router.use("/api/donors", donorsRoutes);
router.use("/api/health", healthRoutes);
router.use("/api/impact", impactRoutes);
router.use("/api/me", meRoutes);
router.use("/api/opportunities", opportunitiesRoutes);
router.use("/api/volunteer", volunteerRoutes);

module.exports = router;
