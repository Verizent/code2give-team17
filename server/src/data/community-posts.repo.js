const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

/** Public + admin list columns — never include contact_email (§21). */
const LIST_COLUMNS = [
  "id",
  "author_name",
  "relationship",
  "story",
  "photo_url",
  "consent_given",
  "status",
  "submitted_at",
  "moderated_at",
  "moderation_note",
].join(", ");

/**
 * @param {{ from: number, to: number, status?: string }} options
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function list({ from, to, status }) {
  let query = getSupabase()
    .from("community_posts")
    .select(LIST_COLUMNS, { count: "exact" })
    .order("submitted_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;
  assertOk(error);
  return { rows: data ?? [], total: count ?? 0 };
}

/**
 * @param {string} id
 * @returns {Promise<object | null>}
 */
async function findById(id) {
  const { data, error } = await getSupabase()
    .from("community_posts")
    .select(LIST_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  assertOk(error);
  return data;
}

/**
 * @param {string} id
 * @param {{ status: string, moderated_by?: string | null, moderation_note?: string | null }} patch
 * @returns {Promise<object>}
 */
async function updateModeration(id, patch) {
  const { data, error } = await getSupabase()
    .from("community_posts")
    .update({
      status: patch.status,
      moderated_at: new Date().toISOString(),
      moderated_by: patch.moderated_by ?? null,
      moderation_note: patch.moderation_note ?? null,
    })
    .eq("id", id)
    .select(LIST_COLUMNS)
    .single();
  assertOk(error);
  return data;
}

/**
 * @param {string} status
 * @returns {Promise<number>}
 */
async function countByStatus(status) {
  const { count, error } = await getSupabase()
    .from("community_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  assertOk(error);
  return count ?? 0;
}

module.exports = {
  list,
  findById,
  updateModeration,
  countByStatus,
};
