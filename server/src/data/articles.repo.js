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

const ADMIN_LIST_COLUMNS = [LIST_COLUMNS, "status", "updated_at", "created_at"].join(", ");

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

const ADMIN_DETAIL_COLUMNS = [DETAIL_COLUMNS, "status", "created_at"].join(", ");

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
 * Admin list — all statuses unless filtered.
 *
 * @param {{ status?: string, category?: string, from: number, to: number }} options
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function listForAdmin({ status, category, from, to }) {
  let query = getSupabase()
    .from("articles")
    .select(ADMIN_LIST_COLUMNS, { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (category) {
    query = query.eq("category", category);
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

/**
 * @param {string} id
 * @returns {Promise<object | null>}
 */
async function findById(id) {
  const { data, error } = await getSupabase()
    .from("articles")
    .select(ADMIN_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  assertOk(error);
  return data ?? null;
}

/**
 * @param {string} slug
 * @returns {Promise<boolean>}
 */
async function slugExists(slug) {
  const { data, error } = await getSupabase()
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  assertOk(error);
  return Boolean(data);
}

/**
 * @param {object} row
 * @returns {Promise<object>}
 */
async function insert(row) {
  const { data, error } = await getSupabase()
    .from("articles")
    .insert(row)
    .select(ADMIN_DETAIL_COLUMNS)
    .single();
  assertOk(error);
  return data;
}

/**
 * @param {string} id
 * @param {object} patch
 * @returns {Promise<object>}
 */
async function update(id, patch) {
  const { data, error } = await getSupabase()
    .from("articles")
    .update(patch)
    .eq("id", id)
    .select(ADMIN_DETAIL_COLUMNS)
    .single();
  assertOk(error);
  return data;
}

module.exports = {
  listPublished,
  listForAdmin,
  findPublishedBySlug,
  findById,
  slugExists,
  insert,
  update,
  LIST_COLUMNS,
  DETAIL_COLUMNS,
  ADMIN_LIST_COLUMNS,
  ADMIN_DETAIL_COLUMNS,
};
