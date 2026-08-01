const { z } = require("zod");

const programmeSchema = z.enum([
  "sports",
  "fitness",
  "nutrition",
  "family_support",
  "community_education",
]);

const sourceSchema = z.enum(["internal", "handson"]);

const statusSchema = z.enum(["draft", "open", "full", "closed", "cancelled"]);

/**
 * Server-derived fields — `id`, `spots_filled`, `last_synced_at`, `handson_opportunity_id`,
 * `status` (defaults to 'open' via DB) — are absent so a client sending one gets a 400 (§29)
 * rather than a silent strip and lost field.
 */
const createOpportunityBodySchema = z.strictObject({
  title_en: z.string().trim().min(1).max(200),
  title_zh: z.string().trim().min(1).max(200),
  description_en: z.string().trim().min(1).max(4000),
  description_zh: z.string().trim().min(1).max(4000),
  location_en: z.string().trim().min(1).max(200),
  location_zh: z.string().trim().min(1).max(200),
  programme: programmeSchema,
  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }),
  capacity: z.number().int().positive().max(1000),
  min_age: z.number().int().min(0).max(120).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  source: sourceSchema.optional().default("internal"),
  handson_url: z.string().url().max(500).optional().nullable(),
  status: statusSchema.optional(),
});

const updateOpportunityBodySchema = createOpportunityBodySchema.partial();

const adminOpportunityListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  programme: programmeSchema.optional(),
  source: sourceSchema.optional(),
  status: statusSchema.optional(),
});

const opportunityIdParamsSchema = z.object({
  id: z.string().uuid(),
});

module.exports = {
  createOpportunityBodySchema,
  updateOpportunityBodySchema,
  adminOpportunityListQuerySchema,
  opportunityIdParamsSchema,
};
