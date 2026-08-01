const express = require("express");
const {
  listCampaigns,
  moderateCampaign,
} = require("../services/campaigns.service");

const router = express.Router();

// DEMO-ONLY: no requireRole('admin') yet — add before production
router.get("/campaigns", async (request, response, next) => {
  try {
    const items = await listCampaigns();
    response.json({ items, meta: { total: items.length } });
  } catch (error) {
    next(error);
  }
});

router.post("/campaigns/:slug/moderate", async (request, response, next) => {
  try {
    const campaign = await moderateCampaign(request.params.slug, request.body.status);
    response.json(campaign);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
