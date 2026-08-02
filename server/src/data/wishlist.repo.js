const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

/**
 * Explicit list rather than `select('*')`, which is what this domain used before the
 * repo was extracted. `pledged` is read here but never written through this module —
 * the `pledge_wishlist_item` RPC owns it (see services/wishlist.service.js).
 */
const COLUMNS =
  "id, title_en, title_zh, why_en, why_zh, needed, pledged, image_url, is_active, created_at, updated_at";

/**
 * Admin listing: every item, active or not. The public read uses `listActive`.
 *
 * @param {{ from: number, to: number }} range
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function listAll({ from, to }) {
  const { data, error, count } = await getSupabase()
    .from("wishlist_items")
    .select(COLUMNS, { count: "exact" })
    .order("created_at", { ascending: true })
    .range(from, to);

  assertOk(error);
  return { rows: data ?? [], total: count ?? 0 };
}

/**
 * Public listing — active items only.
 *
 * @returns {Promise<object[]>}
 */
async function listActive() {
  const { data, error } = await getSupabase()
    .from("wishlist_items")
    .select(COLUMNS)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  assertOk(error);
  return data ?? [];
}

/**
 * @param {string} id Text primary key — a slug, not a uuid.
 * @returns {Promise<object | null>}
 */
async function findById(id) {
  const { data, error } = await getSupabase()
    .from("wishlist_items")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  assertOk(error);
  return data ?? null;
}

/**
 * Public detail read — active items only, so a deactivated item 404s publicly while
 * staying visible in the admin list.
 *
 * @param {string} id
 * @returns {Promise<object | null>}
 */
async function findActiveById(id) {
  const { data, error } = await getSupabase()
    .from("wishlist_items")
    .select(COLUMNS)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  assertOk(error);
  return data ?? null;
}

/**
 * @param {object} values
 * @returns {Promise<object>}
 */
async function create(values) {
  const { data, error } = await getSupabase()
    .from("wishlist_items")
    .insert(values)
    .select(COLUMNS)
    .single();

  assertOk(error);
  return data;
}

/**
 * @param {string} id
 * @param {object} patch
 * @returns {Promise<object | null>} null when no row matched
 */
async function update(id, patch) {
  const { data, error } = await getSupabase()
    .from("wishlist_items")
    .update(patch)
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  assertOk(error);
  return data ?? null;
}

/**
 * @param {string} id
 * @returns {Promise<object | null>} null when no row matched
 */
async function remove(id) {
  const { data, error } = await getSupabase()
    .from("wishlist_items")
    .delete()
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  assertOk(error);
  return data ?? null;
}

module.exports = { listAll, listActive, findById, findActiveById, create, update, remove };
