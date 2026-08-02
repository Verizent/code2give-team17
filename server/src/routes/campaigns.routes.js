const express = require("express");
const {
  listCampaignsForGive,
  getCampaignBySlug,
  createCampaign,
} = require("../services/campaigns.service");

const router = express.Router();

router.get("/", async (request, response, next) => {
  try {
    const slugs = String(request.query.slugs || "")
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean);
    const { public: publicItems, mine } = await listCampaignsForGive(slugs);
    response.json({
      public: publicItems,
      mine,
      meta: { public: publicItems.length, mine: mine.length },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (request, response, next) => {
  try {
    const campaign = await createCampaign(request.body);
    response.status(201).json(campaign);
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (request, response, next) => {
  try {
    const campaign = await getCampaignBySlug(request.params.slug);
    if (!campaign) {
      response.status(404).json({
        error: "Not Found",
        message: "Campaign not found",
        code: "NOT_FOUND",
      });
      return;
    }
    response.json(campaign);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
