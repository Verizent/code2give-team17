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

const statusSchema = z.enum(["draft", "open", "closed", "cancelled"]);

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

// Mirrors the database's discovery_sources_are_known constraint. Kept in step by hand: a
// value accepted here and rejected there is a 500 on an otherwise valid signup.
const discoverySourceSchema = z.enum([
  "instagram",
  "facebook",
  "word_of_mouth",
  "university",
  "company",
  "handson",
  "time_auction",
  "search",
  "love21_site",
  "event",
  "other",
]);

// verification_token is optional here and enforced in signups.service: a signed-in caller
// signing up their own address has already proved it to Supabase Auth, and making them read
// a code out of their inbox again would be theatre. Everyone else must present one — this
// endpoint is unauthenticated, so the token is the only thing standing between it and
// signing up an address the caller does not own.
const guestSignupBodySchema = z.object({
  opportunity_id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(120),
  email: emailSchema,
  verification_token: z.string().min(32).optional(),
  phone: z.string().trim().max(40).optional().nullable(),
  locale: z.enum(["en", "zh-Hant"]).optional(),
  // Optional: an existing volunteer has already answered, and nobody should be blocked from
  // a session for declining to say where they heard about us.
  discovery_sources: z.array(discoverySourceSchema).max(11).optional(),
  discovery_other: z.string().trim().max(200).optional().nullable(),
});

const discoveryStatusQuerySchema = z.object({ email: emailSchema });

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

// The no-opportunity_id path also backs the organisation enquiry panel, which is the only
// form that carries a company name.
const createProgrammeInterestBodySchema = createInterestBodySchema.extend({
  opportunity_id: z.string().uuid().optional().nullable(),
  organisation: z.string().trim().max(200).optional().nullable(),
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
  discoveryStatusQuerySchema,
  listSignupsQuerySchema,
  signupIdParamsSchema,
  createInterestBodySchema,
  createProgrammeInterestBodySchema,
};
