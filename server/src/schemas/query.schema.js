const { z } = require("zod");

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 12;

/**
 * The shared list query: `?page=`, `?limit=`, `?locale=`.
 *
 * Strips undeclared keys rather than rejecting them. Link sharing and client libraries
 * append parameters we never declared, and a 400 for an unknown query key is a baffling
 * failure for whoever is building the frontend. Bodies are strict; queries are not.
 *
 * `limit` is clamped at the top and rejected at the bottom, which is not an
 * inconsistency: `?limit=100` arrives from a shared link the visitor merely clicked,
 * and an error they cannot act on is worse than 50 rows. `?limit=0` asks for nothing
 * and is a real bug worth surfacing. The clamp needs no warning because `meta.limit`
 * already reports what was actually applied.
 */
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .default(DEFAULT_LIMIT)
    .transform((value) => Math.min(value, MAX_LIMIT)),
  locale: z.enum(["en", "zh-Hant"]).default("en"),
});

/** `?locale=` alone, for single-resource reads like `GET /api/impact`. */
const localeQuerySchema = z.object({
  locale: z.enum(["en", "zh-Hant"]).default("en"),
});

/**
 * `GET /api/articles` — the shared list query plus the filters that switch the
 * News tabs and feed the Home featured strip.
 *
 * `is_featured` is an explicit `"true"`/`"false"` enum rather than `z.coerce.boolean()`,
 * which would read the string `"false"` as true and quietly return featured articles
 * to a caller that asked for the opposite.
 */
const articleListQuerySchema = listQuerySchema.extend({
  category: z.enum(["news", "education", "report"]).optional(),
  tag: z.string().min(1).optional(),
  is_featured: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

/** `GET /api/articles/:slug`. */
const slugParamSchema = z.object({
  slug: z.string().min(1).max(120),
});

/** `POST /api/admin/community-posts/:id/moderate` — the `:id` path segment. */
const idParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * `POST /api/admin/community-posts/:id/moderate` body.
 *
 * Strict so unknown keys 400 rather than being silently ignored — this is an admin
 * action and a stray field is more likely a client bug than a benign query parameter.
 */
const moderateSchema = z.strictObject({
  status: z.enum(["approved", "rejected"]),
  moderation_note: z.string().optional(),
});

module.exports = {
  listQuerySchema,
  localeQuerySchema,
  articleListQuerySchema,
  slugParamSchema,
  idParamSchema,
  moderateSchema,
};
