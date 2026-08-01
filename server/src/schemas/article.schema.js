const { z } = require("zod");
const { bodySchema } = require("./blocks.schema");

const optionalText = z.string().optional();

/**
 * A new article, as the admin editor submits it.
 *
 * Strict on purpose: an unknown field in a body really is a mistake, and stripping it
 * silently means a save that appears to work and quietly loses a field.
 *
 * `slug`, `status`, `reading_time_minutes` and `published_at` are **absent by design** —
 * the server derives every one of them, so a client that sends one gets a 400 rather
 * than having its value ignored.
 *
 * `category` carries no `'voice'`: Voices are supporter submissions living in
 * `community_posts`, which has the moderation state the tab depends on (CONTEXT.md §21).
 */
const createArticleSchema = z.strictObject({
  category: z.enum(["news", "education", "report"]),

  title_en: z.string().min(1),
  title_zh: optionalText,
  excerpt_en: optionalText,
  excerpt_zh: optionalText,
  body_en: bodySchema.optional(),
  body_zh: bodySchema.optional(),

  cover_image_url: optionalText,
  cover_alt_en: optionalText,
  cover_alt_zh: optionalText,
  attachment_url: optionalText,

  author: optionalText,
  tags: z.array(z.string()).optional(),
  is_featured: z.boolean().optional(),

  meta_title_en: optionalText,
  meta_title_zh: optionalText,
  meta_description_en: optionalText,
  meta_description_zh: optionalText,
  og_image_url: optionalText,
});

/**
 * A partial edit.
 *
 * `slug` is permitted here and only here. It is never re-derived from a changed title —
 * renaming an article must not move its public URL — so changing it has to be a
 * deliberate act (plan §7).
 */
const updateArticleSchema = createArticleSchema.partial().extend({
  slug: z.string().min(1).optional(),
});

module.exports = { createArticleSchema, updateArticleSchema };
