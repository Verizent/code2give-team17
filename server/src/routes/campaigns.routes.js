const express = require("express");
const { validate } = require("../middleware/validate");
const { listQuerySchema, slugParamSchema } = require("../schemas/query.schema");
const { createCampaignSchema } = require("../schemas/campaign.schema");
const { envelope } = require("../lib/envelope");
const campaignsService = require("../services/donations/campaigns.service");

const router = express.Router();

/** Approved fundraisers only — public directory. */
router.get("/", validate({ query: listQuerySchema }), async (request, response, next) => {
  try {
    const { items, meta } = await campaignsService.listApproved(request.validatedQuery);
    response.json(envelope(items, meta));
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  validate({ body: createCampaignSchema }),
  async (request, response, next) => {
    try {
      const campaign = await campaignsService.createCampaign(request.body);
      response.status(201).json(envelope(campaign));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:slug",
  validate({ params: slugParamSchema }),
  async (request, response, next) => {
    try {
      const campaign = await campaignsService.getBySlug(request.validatedParams.slug);
      response.json(envelope(campaign));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
