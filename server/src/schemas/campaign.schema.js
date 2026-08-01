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

const moderateCampaignSchema = z.strictObject({
  status: z.enum(["approved", "rejected"]),
});

const campaignIdParamSchema = z.object({
  id: z.string().uuid(),
});

module.exports = {
  CAMPAIGN_STATUSES,
  createCampaignSchema,
  moderateCampaignSchema,
  campaignIdParamSchema,
};
