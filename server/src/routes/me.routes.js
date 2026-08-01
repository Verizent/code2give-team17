const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { envelope } = require("../lib/envelope");
const impactService = require("../services/me/impact.service");

const router = express.Router();

/** PAGE 5 — supporter retention: garden, proof receipts, conversion, prefs. */
router.get("/impact", requireAuth, async (request, response, next) => {
  try {
    const impact = await impactService.getMeImpact(request.user);
    response.json(envelope(impact));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
