const { z } = require("zod");

const createSignupSchema = z.strictObject({
  opportunity_id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().nullable(),
  locale: z.enum(["en", "zh-Hant"]).optional(),
});

const createInterestSchema = z.strictObject({
  full_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().nullable(),
  locale: z.enum(["en", "zh-Hant"]).optional(),
  message: z.string().trim().max(2000).optional().nullable(),
});

/** Hub programme lead — optional listing link. */
const createProgrammeInterestSchema = createInterestSchema.extend({
  opportunity_id: z.string().uuid().optional().nullable(),
});

const signupIdParamSchema = z.object({
  id: z.string().uuid(),
});

module.exports = {
  createSignupSchema,
  createInterestSchema,
  createProgrammeInterestSchema,
  signupIdParamSchema,
};
