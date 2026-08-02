const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

/**
 * Columns returned to the public. `contact_email` is intentionally absent — it is a
 * notification-only field that must never appear in a visitor response.
 */
const PUBLIC_COLUMNS = [
  "id",
  "author_name",
  "relationship",
  "activity_type",
  "story",
  "photo_url",
  "submitted_at",
].join(", ");

/**
 * Admin queue adds the notification email and moderation metadata.
 */
const ADMIN_COLUMNS = [
  PUBLIC_COLUMNS,
  "contact_email",
  "status",
  "moderation_note",
  "moderated_at",
  "moderated_by",
].join(", ");

/**
 * Approved posts for the public Voices tab, newest first.
 *
 * @param {{ from: number, to: number }} options
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function listApproved({ from, to }) {
  const { data, error, count } = await getSupabase()
    .from("community_posts")
    .select(PUBLIC_COLUMNS, { count: "exact" })
    .eq("status", "approved")
    .order("submitted_at", { ascending: false })
    .range(from, to);

  assertOk(error);

  return { rows: data ?? [], total: count ?? 0 };
}

/**
 * Pending posts for the admin moderation queue, oldest first (first-in, first-reviewed).
 *
 * @param {{ from: number, to: number }} options
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function listPending({ from, to }) {
  const { data, error, count } = await getSupabase()
    .from("community_posts")
    .select(ADMIN_COLUMNS, { count: "exact" })
    .eq("status", "pending")
    .order("submitted_at", { ascending: true })
    .range(from, to);

  assertOk(error);

  return { rows: data ?? [], total: count ?? 0 };
}

/**
 * Inserts a new submission (status defaults to 'pending' at the DB level).
 *
 * The caller is responsible for stripping the honeypot `website` field before calling
 * this — it is not a database column.
 *
 * @param {{ author_name: string, relationship: string, story: string, photo_url?: string, contact_email?: string, consent_given: true }} data
 * @returns {Promise<{ id: string, submitted_at: string }>}
 */
async function create(data) {
  const { data: row, error } = await getSupabase()
    .from("community_posts")
    .insert(data)
    .select("id, submitted_at")
    .single();

  assertOk(error);

  return row;
}

/**
 * Approves or rejects a post. Returns the updated row, or `null` if the id does not exist.
 *
 * @param {string} id
 * @param {{ status: 'approved'|'rejected', moderation_note?: string }} options
 * @returns {Promise<object | null>}
 */
async function moderate(id, { status, moderation_note }) {
  const update = { status, moderated_at: new Date().toISOString() };
  if (moderation_note !== undefined) {
    update.moderation_note = moderation_note;
  }

  const { data, error } = await getSupabase()
    .from("community_posts")
    .update(update)
    .eq("id", id)
    .select(ADMIN_COLUMNS)
    .maybeSingle();

  assertOk(error);

  return data ?? null;
}

module.exports = { listApproved, listPending, create, moderate, PUBLIC_COLUMNS, ADMIN_COLUMNS };
