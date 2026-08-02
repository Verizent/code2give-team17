const { z } = require("zod");

const PROGRAMMES = ["sports", "fitness", "nutrition", "family", "where_needed"];
const FREQUENCIES = ["once", "weekly", "monthly"];

const recordDonationSchema = z.strictObject({
  amount_hkd: z.number().int().positive().max(1_000_000),
  frequency: z.enum(FREQUENCIES),
  programme: z.enum(PROGRAMMES),
  email: z.string().trim().email().max(254),
  full_name: z.string().trim().max(120).optional().nullable(),
  tracking_opt_in: z.boolean().optional(),
  campaign_id: z.string().trim().max(120).optional().nullable(),
  locale: z.enum(["en", "zh-Hant"]).optional(),
});

const recoverLinkSchema = z.strictObject({
  email: z.string().trim().email().max(254),
});

const notifySchema = z.strictObject({
  email: z.string().trim().email().max(254),
  donation_id: z.string().min(1).max(120),
  stage: z.string().min(1).max(60),
});

const trackTokenParamSchema = z.object({
  token: z.string().min(32).max(128),
});

module.exports = {
  recordDonationSchema,
  recoverLinkSchema,
  notifySchema,
  trackTokenParamSchema,
  PROGRAMMES,
  FREQUENCIES,
};
