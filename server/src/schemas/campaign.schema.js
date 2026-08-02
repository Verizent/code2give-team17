const { z } = require("zod");

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
 * Every field optional, but the field rules match create exactly — a PATCH is not a licence
 * to write a 2-character title.
 *
 * `slug`, `status`, `raised_hkd` and `id` are absent on purpose. They are server-derived
 * (§29): slug is the public `/c/:slug` URL and must not move when a title is edited, status
 * belongs to the `/moderate` verb route, and raised_hkd only ever moves through the Stripe
 * webhook. Strict means sending one is a 400 rather than a silently dropped key.
 */
const updateCampaignSchema = z.strictObject({
  title: z.string().trim().min(4).max(120).optional(),
  story: z.string().trim().min(20).max(8000).optional(),
  goal_hkd: z.number().int().min(500).max(10_000_000).optional(),
  cover_image_url: z.string().trim().min(1).max(500).optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "end_date must be YYYY-MM-DD")
    .optional(),
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
  moderateCampaignSchema,
  campaignIdParamSchema,
};
