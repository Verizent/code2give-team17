const express = require("express");
const { validate } = require("../../middleware/validate");
const { listQuerySchema, idParamSchema } = require("../../schemas/query.schema");
const {
  updateCampaignSchema,
  moderateCampaignSchema,
} = require("../../schemas/campaign.schema");
const { envelope } = require("../../lib/envelope");
const campaignsService = require("../../services/donations/campaigns.service");

const router = express.Router();

/**
 * Admin fundraiser management. Mounted behind `adminGuard` in routes/index.js.
 *
 * Everything here is **id-keyed**, unlike the public routes. A fundraiser's slug is its
 * public URL and stays put, but the moderation queue addresses rows by id — which is also
 * what `campaign-store.ts` sends. The previous slug-keyed moderate route could never have
 * matched it.
 */

router.get("/", validate({ query: listQuerySchema }), async (req, res, next) => {
  try {
    const { items, meta } = await campaignsService.listForAdmin({
      ...req.validatedQuery,
      status: req.query.status,
    });
    res.json(envelope(items, meta));
  } catch (e) { next(e); }
});

router.patch(
  "/:id",
  validate({ params: idParamSchema, body: updateCampaignSchema }),
  async (req, res, next) => {
    try {
      res.json(envelope(await campaignsService.updateCampaign(req.validatedParams.id, req.body)));
    } catch (e) { next(e); }
  },
);

// Refuses with a 409 once any donation points at the campaign — see the service for why
// the database cannot be relied on to stop this.
router.delete("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await campaignsService.deleteCampaign(req.validatedParams.id)));
  } catch (e) { next(e); }
});

// A verb route rather than a status field on PATCH: moderation is a state transition with
// its own rules (only `pending_approval` may move), and §29 keeps status out of the write
// schema so it cannot be set as an ordinary field.
router.post(
  "/:id/moderate",
  validate({ params: idParamSchema, body: moderateCampaignSchema }),
  async (req, res, next) => {
    try {
      res.json(
        envelope(await campaignsService.moderateCampaign(req.validatedParams.id, req.body.status)),
      );
    } catch (e) { next(e); }
  },
);

module.exports = router;
