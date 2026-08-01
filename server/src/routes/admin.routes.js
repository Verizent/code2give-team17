const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { listQuerySchema } = require("../schemas/query.schema");
const {
  moderateCampaignSchema,
  campaignIdParamSchema,
} = require("../schemas/campaign.schema");
const { envelope } = require("../lib/envelope");
const campaignsService = require("../services/donations/campaigns.service");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

const adminCampaignListQuery = listQuerySchema.extend({
  status: z
    .enum(["pending_approval", "approved", "rejected", "all"])
    .default("pending_approval"),
});

router.get(
  "/campaigns",
  validate({ query: adminCampaignListQuery }),
  async (request, response, next) => {
    try {
      const { items, meta } = await campaignsService.listForAdmin(
        request.validatedQuery,
      );
      response.json(envelope(items, meta));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/campaigns/:id/moderate",
  validate({ params: campaignIdParamSchema, body: moderateCampaignSchema }),
  async (request, response, next) => {
    try {
      const campaign = await campaignsService.moderateCampaign(
        request.validatedParams.id,
        request.body.status,
      );
      response.json(envelope(campaign));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
