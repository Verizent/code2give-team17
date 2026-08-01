const { z } = require("zod");

const discoverySourceSchema = z.enum([
  "handson",
  "time_auction",
  "love21_site",
  "social",
  "friend_colleague",
  "employer_csr",
  "school",
  "search",
  "other",
]);

/**
 * The seven §23 columns. Strict-object so an unknown key is a 400 (a save that
 * looks like it worked and quietly lost a field is the exact failure mode this
 * project bans). At least one key must be present — an empty body is a 400.
 */
const patchSignupBodySchema = z
  .strictObject({
    discovery_source: discoverySourceSchema.optional(),
    discovery_source_other: z.string().trim().max(200).optional().nullable(),
    signup_motivation: z.string().trim().max(2000).optional().nullable(),
    experience_rating: z.number().int().min(1).max(5).optional(),
    would_return: z.boolean().optional(),
    improvement_note: z.string().trim().max(2000).optional().nullable(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "Body must include at least one field",
  });

const signupIdParamsSchema = z.object({
  id: z.string().uuid(),
});

module.exports = { patchSignupBodySchema, signupIdParamsSchema };
