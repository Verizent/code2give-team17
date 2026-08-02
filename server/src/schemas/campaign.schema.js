const { z } = require("zod");
const { listQuerySchema } = require("./query.schema");

const CAMPAIGN_STATUSES = ["pending_approval", "approved", "rejected"];

const createCampaignSchema = z.strictObject({
  title: z.string().trim().min(4).max(120),
  story: z.string().trim().min(20).max(8000),
  goal_hkd: z.number().int().min(500).max(10_000_000),
  cover_image_url: z.string().trim().min(1).max(500),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "end_date must be YYYY-MM-DD"),
});

/**
 * Every field optional, with the field rules inherited from create — a PATCH is not a
 * licence to write a 2-character title. Derived rather than restated so the two cannot
 * drift: tightening a rule on create must not silently leave the PATCH path permissive.
 *
 * `.partial()` on a `strictObject` stays strict, so `slug`, `status`, `raised_hkd` and `id`
 * remain a 400 rather than a silently dropped key. They are server-derived (§29): slug is
 * the public `/c/:slug` URL and must not move when a title is edited, status belongs to the
 * `/moderate` verb route, and raised_hkd only ever moves through the Stripe webhook.
 *
 * This also accepts `{}`; the service rejects an empty patch, because "which layer says no"
 * matters less than it being said once.
 */
const updateCampaignSchema = createCampaignSchema.partial();

/**
 * The admin queue's list query. `status` is declared here rather than read off raw
 * `req.query`, so an unknown value is a 400 instead of a silent empty page — the shared
 * `listQuerySchema` strips undeclared keys, which would drop it on the floor.
 *
 * `all` is a sentinel meaning "do not filter", handled in the service.
 */
const adminCampaignListQuerySchema = listQuerySchema.extend({
  status: z.enum([...CAMPAIGN_STATUSES, "all"]).optional(),
});

const moderateCampaignSchema = z.strictObject({
  status: z.enum(["approved", "rejected"]),
});

const campaignIdParamSchema = z.object({
  id: z.string().uuid(),
});

module.exports = {
  CAMPAIGN_STATUSES,
  createCampaignSchema,
  updateCampaignSchema,
  adminCampaignListQuerySchema,
  moderateCampaignSchema,
  campaignIdParamSchema,
};
