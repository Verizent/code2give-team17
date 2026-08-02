const { z } = require("zod");

/**
 * `wishlist_items.id` is a TEXT primary key with no default, so the admin supplies a
 * slug rather than the database minting a uuid. The shared `idParamSchema` in
 * query.schema.js is `z.string().uuid()` and would 400 every real id in this table,
 * which is why this domain carries its own.
 */
const wishlistIdParamSchema = z.object({
  id: z.string().min(1).max(64),
});

/**
 * `POST /api/admin/wishlist`.
 *
 * Strict, so an unknown key is a 400 rather than a save that looks like it worked and
 * quietly lost a field (§29).
 *
 * `pledged` is deliberately absent. It is derived — the `pledge_wishlist_item` RPC owns
 * it — so a client that sends it gets a 400 instead of having the value ignored. Same
 * reasoning as `slug`/`reading_time_minutes` being absent from the article create schema.
 *
 * The five text columns and `needed` are all NOT NULL on the table with no default, so
 * they are required here; sending them as optional would trade a clear 400 for a
 * constraint violation surfacing as a 500.
 */
const createWishlistItemSchema = z.strictObject({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id must be a lowercase slug, e.g. sports-equipment"),
  title_en: z.string().min(1).max(200),
  title_zh: z.string().min(1).max(200),
  why_en: z.string().min(1).max(1000),
  why_zh: z.string().min(1).max(1000),
  needed: z.number().int().min(1),
  image_url: z.string().url().max(500),
  is_active: z.boolean().optional(),
});

/**
 * `PATCH /api/admin/wishlist/:id`.
 *
 * Every field optional, but `id` and `pledged` are absent entirely: the id is the path
 * segment and renaming a primary key through a PATCH body is not a thing this API does,
 * and `pledged` is derived.
 *
 * Lowering `needed` below the pledges already recorded is refused in the service rather
 * than here, because the check needs the current row.
 */
const updateWishlistItemSchema = z.strictObject({
  title_en: z.string().min(1).max(200).optional(),
  title_zh: z.string().min(1).max(200).optional(),
  why_en: z.string().min(1).max(1000).optional(),
  why_zh: z.string().min(1).max(1000).optional(),
  needed: z.number().int().min(1).optional(),
  image_url: z.string().url().max(500).optional(),
  is_active: z.boolean().optional(),
});

module.exports = {
  wishlistIdParamSchema,
  createWishlistItemSchema,
  updateWishlistItemSchema,
};
