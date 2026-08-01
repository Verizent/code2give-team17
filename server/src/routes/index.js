const express = require("express");
const healthRoutes = require("./health.routes");
const opportunitiesRoutes = require("./opportunities.routes");
const emailVerificationsRoutes = require("./email-verifications.routes");
const volunteersRoutes = require("./volunteers.routes");
const volunteerSignupsRoutes = require("./volunteer-signups.routes");
const volunteerRoutes = require("./volunteer.routes");
const adminRoutes = require("./admin");

const router = express.Router();

router.get("/api", (request, response) => {
  response.json({
    message: "Code2Give Team 17 API",
    status: "running",
  });
});

router.use("/api/health", healthRoutes);
router.use("/api/opportunities", opportunitiesRoutes);
router.use("/api/email-verifications", emailVerificationsRoutes);
router.use("/api/volunteers", volunteersRoutes);
router.use("/api/volunteer-signups", volunteerSignupsRoutes);
router.use("/api/volunteer", volunteerRoutes);
router.use("/api/admin", adminRoutes);

module.exports = router;
