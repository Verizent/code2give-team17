const express = require("express");
const { validate } = require("../middleware/validate");
const { listQuerySchema, slugParamSchema } = require("../schemas/query.schema");
const { createCampaignSchema } = require("../schemas/campaign.schema");
const { envelope } = require("../lib/envelope");
const campaignsService = require("../services/donations/campaigns.service");

const router = express.Router();

/**
 * Public fundraiser directory — approved only.
 *
 * Previously returned a bare `{ public, mine, meta }` with no `data` key, which `apiData`
 * unwraps to `undefined`; the client's `(data ?? [])` then rendered an empty directory with
 * no error anywhere. The "mine" half is a client concern: the browser keeps its own slugs
 * in sessionStorage and reads each one back through `/:slug`.
 */
router.get("/", validate({ query: listQuerySchema }), async (req, res, next) => {
  try {
    const { items, meta } = await campaignsService.listApproved(req.validatedQuery);
    res.json(envelope(items, meta));
  } catch (e) { next(e); }
});

// Slug-keyed, not id-keyed: here the slug IS the stable public `/c/:slug` URL. Pending and
// rejected rows are returned too, so a creator can see their own status.
router.get("/:slug", validate({ params: slugParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await campaignsService.getBySlug(req.validatedParams.slug)));
  } catch (e) { next(e); }
});

// Public on purpose: a visitor starts a fundraiser and it lands `pending_approval` for an
// admin to review. DEMO-ONLY: unrate-limited, like POST /api/community-posts (§19).
router.post("/", validate({ body: createCampaignSchema }), async (req, res, next) => {
  try {
    res.status(201).json(envelope(await campaignsService.createCampaign(req.body)));
  } catch (e) { next(e); }
});

module.exports = router;
