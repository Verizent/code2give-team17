const { z } = require("zod");

const signupPatchSchema = z.strictObject({
  id: z.string().uuid(),
  hours_logged: z.number().min(0).max(24),
  status: z.enum(["attended", "no_show"]),
});

const markAttendanceBodySchema = z.strictObject({
  signups: z.array(signupPatchSchema).min(1).max(500),
});

const opportunityIdParamsSchema = z.object({
  id: z.string().uuid(),
});

module.exports = {
  signupPatchSchema,
  markAttendanceBodySchema,
  opportunityIdParamsSchema,
};
