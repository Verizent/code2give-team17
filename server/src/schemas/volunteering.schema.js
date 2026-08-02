const { z } = require("zod");

const localeSchema = z.enum(["en", "zh-Hant"]).optional().default("en");

const opportunityDetailQuerySchema = z.object({
  locale: localeSchema,
});

const programmeSchema = z.enum([
  "sports",
  "fitness",
  "nutrition",
  "family_support",
  "community_education",
]);

const sourceSchema = z.enum(["internal", "handson"]);

const statusSchema = z.enum(["draft", "open", "full", "closed", "cancelled"]);

const listOpportunitiesQuerySchema = z.object({
  locale: localeSchema,
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  programme: programmeSchema.optional(),
  source: sourceSchema.optional(),
  status: statusSchema.optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

const opportunityIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const emailSchema = z.string().trim().email().max(320);

const startEmailVerificationBodySchema = z.object({
  email: emailSchema,
});

const confirmEmailVerificationParamsSchema = z.object({
  id: z.string().uuid(),
});

const confirmEmailVerificationBodySchema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

const createVolunteerBodySchema = z.object({
  email: emailSchema,
  full_name: z.string().trim().min(1).max(200),
  verification_token: z.string().min(32),
  locale: localeSchema.optional(),
  phone: z.string().trim().max(40).optional(),
});

const volunteerTokenParamsSchema = z.object({
  token: z.string().min(32),
});

const createSignupBodySchema = z.object({
  opportunity_id: z.string().uuid(),
});

const guestSignupBodySchema = z.object({
  opportunity_id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(120),
  email: emailSchema,
  phone: z.string().trim().max(40).optional().nullable(),
  locale: z.enum(["en", "zh-Hant"]).optional(),
});

const listSignupsQuerySchema = z.object({
  opportunity_id: z.string().uuid().optional(),
});

const signupIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const createInterestBodySchema = z.object({
  email: emailSchema,
  full_name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(40).optional().nullable(),
  message: z.string().trim().max(2000).optional().nullable(),
  locale: localeSchema.optional(),
});

const createProgrammeInterestBodySchema = createInterestBodySchema.extend({
  opportunity_id: z.string().uuid().optional().nullable(),
});

module.exports = {
  listOpportunitiesQuerySchema,
  opportunityDetailQuerySchema,
  programmeSchema,
  sourceSchema,
  opportunityIdParamsSchema,
  startEmailVerificationBodySchema,
  confirmEmailVerificationParamsSchema,
  confirmEmailVerificationBodySchema,
  createVolunteerBodySchema,
  volunteerTokenParamsSchema,
  createSignupBodySchema,
  guestSignupBodySchema,
  listSignupsQuerySchema,
  signupIdParamsSchema,
  createInterestBodySchema,
  createProgrammeInterestBodySchema,
};
