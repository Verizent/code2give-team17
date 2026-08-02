const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

/**
 * Columns are named explicitly rather than `select('*')`. `body_en` / `body_zh` are
 * absent on purpose: a page of twelve full block arrays is a large payload for a view
 * that renders excerpts, and the detail endpoint carries the rest.
 */
const LIST_COLUMNS = [
  "id",
  "slug",
  "category",
  "title_en",
  "title_zh",
  "excerpt_en",
  "excerpt_zh",
  "cover_image_url",
  "cover_alt_en",
  "cover_alt_zh",
  "tags",
  "author",
  "published_at",
  "reading_time_minutes",
  "is_featured",
].join(", ");

const DETAIL_COLUMNS = [
  LIST_COLUMNS,
  "body_en",
  "body_zh",
  "attachment_url",
  "meta_title_en",
  "meta_title_zh",
  "meta_description_en",
  "meta_description_zh",
  "og_image_url",
  "updated_at",
].join(", ");

/**
 * Published articles only, newest first.
 *
 * Every visitor query filters `status='published'`; the featured strip on Home runs
 * through this same function precisely so there is one place to forget it, not two.
 *
 * @param {{ category?: string, tag?: string, isFeatured?: boolean, from: number, to: number }} options
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function listPublished({ category, tag, isFeatured, from, to }) {
  let query = getSupabase()
    .from("articles")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (category) {
    query = query.eq("category", category);
  }
  if (tag) {
    query = query.contains("tags", [tag]);
  }
  if (isFeatured !== undefined) {
    query = query.eq("is_featured", isFeatured);
  }

  const { data, error, count } = await query;
  assertOk(error);

  return { rows: data ?? [], total: count ?? 0 };
}

/**
 * A slug that does not exist and a slug whose article is unpublished both resolve to
 * `null`, so the route answers 404 for each. Distinguishing them would let anyone
 * confirm a draft exists by probing slugs.
 *
 * @param {string} slug
 * @returns {Promise<object | null>}
 */
async function findPublishedBySlug(slug) {
  const { data, error } = await getSupabase()
    .from("articles")
    .select(DETAIL_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  assertOk(error);

  return data ?? null;
}

/** Admin: all statuses, both locale columns returned raw. */
async function listAll({ category, status, from, to }) {
  let query = getSupabase()
    .from("articles")
    .select(DETAIL_COLUMNS, { count: "exact" })
    .order("published_at", { ascending: false })
    .range(from, to);

  if (category) query = query.eq("category", category);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  assertOk(error);
  return { rows: data ?? [], total: count ?? 0 };
}

/** Admin: find by slug regardless of status. */
async function findBySlug(slug) {
  const { data, error } = await getSupabase()
    .from("articles")
    .select(DETAIL_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  assertOk(error);
  return data ?? null;
}

/** Check if a slug is already taken (used by uniqueSlug). */
async function slugExists(slug) {
  const { data, error } = await getSupabase()
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  assertOk(error);
  return data !== null;
}

async function create(data) {
  const { data: row, error } = await getSupabase()
    .from("articles")
    .insert(data)
    .select(DETAIL_COLUMNS)
    .single();
  assertOk(error);
  return row;
}

async function update(slug, data) {
  const { data: row, error } = await getSupabase()
    .from("articles")
    .update(data)
    .eq("slug", slug)
    .select(DETAIL_COLUMNS)
    .maybeSingle();
  assertOk(error);
  return row ?? null;
}

/**
 * The admin surface addresses articles by id, not slug.
 *
 * `slug` is editable, so a PATCH that changes it would destroy the identifier the request
 * was addressed by — a retry after a timeout could not tell "already renamed" from "never
 * existed". `findBySlug` stays for the PUBLIC route, where the slug IS the stable URL.
 *
 * @param {string} id
 */
async function findById(id) {
  const { data: row, error } = await getSupabase()
    .from("articles")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  assertOk(error);
  return row ?? null;
}

/**
 * @param {string} id
 * @param {object} data
 */
async function updateById(id, data) {
  const { data: row, error } = await getSupabase()
    .from("articles")
    .update(data)
    .eq("id", id)
    .select(DETAIL_COLUMNS)
    .maybeSingle();
  assertOk(error);
  return row ?? null;
}

module.exports = {
  listPublished, findPublishedBySlug,
  listAll, findBySlug, slugExists, create, update,
  findById, updateById,
  LIST_COLUMNS, DETAIL_COLUMNS,
};
