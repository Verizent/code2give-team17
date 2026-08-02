const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

/** Live `campaigns` check: `pending_approval` | `approved` | `rejected`. */
const COLUMNS = [
  "id",
  "slug",
  "title",
  "story",
  "goal_hkd",
  "raised_hkd",
  "cover_image_url",
  "end_date",
  "status",
  "created_at",
  "updated_at",
].join(", ");

/**
 * @param {{ from: number, to: number, status?: string }} options
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function list({ from, to, status }) {
  let query = getSupabase()
    .from("campaigns")
    .select(COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;
  assertOk(error);
  return { rows: data ?? [], total: count ?? 0 };
}

/**
 * @param {string} slug
 * @returns {Promise<object | null>}
 */
async function findBySlug(slug) {
  const { data, error } = await getSupabase()
    .from("campaigns")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  assertOk(error);
  return data;
}

/**
 * @param {string} id
 * @returns {Promise<object | null>}
 */
async function findById(id) {
  const { data, error } = await getSupabase()
    .from("campaigns")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  assertOk(error);
  return data;
}

/**
 * @param {string} slug
 * @returns {Promise<boolean>}
 */
async function slugExists(slug) {
  const { data, error } = await getSupabase()
    .from("campaigns")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  assertOk(error);
  return Boolean(data);
}

/**
 * @param {{
 *   slug: string,
 *   title: string,
 *   story: string,
 *   goal_hkd: number,
 *   cover_image_url: string,
 *   end_date: string,
 *   status?: string,
 * }} input
 * @returns {Promise<object>}
 */
async function insert(input) {
  const { data, error } = await getSupabase()
    .from("campaigns")
    .insert({
      slug: input.slug,
      title: input.title,
      story: input.story,
      goal_hkd: input.goal_hkd,
      cover_image_url: input.cover_image_url,
      end_date: input.end_date,
      status: input.status ?? "pending_approval",
      raised_hkd: 0,
    })
    .select(COLUMNS)
    .single();
  assertOk(error);
  return data;
}

/**
 * @param {string} id
 * @param {{ status: string }} patch
 * @returns {Promise<object>}
 */
async function updateStatus(id, patch) {
  const { data, error } = await getSupabase()
    .from("campaigns")
    .update({ status: patch.status })
    .eq("id", id)
    .select(COLUMNS)
    .single();
  assertOk(error);
  return data;
}

/**
 * Patches editable fields. `slug`, `status` and `raised_hkd` are deliberately not
 * writable here — slug is the public `/c/:slug` URL, status moves through
 * `updateStatus` (moderation), and `raised_hkd` only ever moves via `addRaised`.
 *
 * @param {string} id
 * @param {{ title?: string, story?: string, goal_hkd?: number,
 *   cover_image_url?: string, end_date?: string }} patch
 * @returns {Promise<object>}
 */
async function update(id, patch) {
  const { data, error } = await getSupabase()
    .from("campaigns")
    .update(patch)
    .eq("id", id)
    .select(COLUMNS)
    .single();
  assertOk(error);
  return data;
}

/**
 * Hard delete. Callers must check for referencing donations first —
 * `donations_campaign_id_fkey` is ON DELETE SET NULL, so Postgres raises nothing and
 * quietly strips the attribution instead of refusing.
 *
 * @param {string} id
 * @returns {Promise<object | null>}
 */
async function remove(id) {
  const { data, error } = await getSupabase()
    .from("campaigns")
    .delete()
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();
  assertOk(error);
  return data;
}

/**
 * @param {string} id
 * @param {number} amountHkd
 * @returns {Promise<object | null>}
 */
async function addRaised(id, amountHkd) {
  const row = await findById(id);
  if (!row) return null;
  const { data, error } = await getSupabase()
    .from("campaigns")
    .update({ raised_hkd: row.raised_hkd + amountHkd })
    .eq("id", id)
    .select(COLUMNS)
    .single();
  assertOk(error);
  return data;
}

module.exports = {
  list,
  findBySlug,
  findById,
  slugExists,
  insert,
  update,
  remove,
  updateStatus,
  addRaised,
};
