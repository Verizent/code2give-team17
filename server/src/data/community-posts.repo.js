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
 * Posts in one moderation state, for the admin queue.
 *
 * Pending sorts oldest first — first in, first reviewed. Decided posts sort newest
 * first, because there the row worth seeing is the one just acted on, not the oldest.
 *
 * @param {{ status: 'pending'|'approved'|'rejected', from: number, to: number }} options
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function listByStatus({ status, from, to }) {
  const { data, error, count } = await getSupabase()
    .from("community_posts")
    .select(ADMIN_COLUMNS, { count: "exact" })
    .eq("status", status)
    .order("submitted_at", { ascending: status === "pending" })
    .range(from, to);

  assertOk(error);

  return { rows: data ?? [], total: count ?? 0 };
}

/**
 * Counts posts in one moderation state, without transferring any rows.
 *
 * `head: true` asks PostgREST for the count alone — the dashboard needs the number and
 * nothing else, and `community_posts` carries `contact_email`, which should not travel
 * to a caller that is only going to render a badge.
 *
 * @param {string} status
 * @returns {Promise<number>}
 */
async function countByStatus(status) {
  const { error, count } = await getSupabase()
    .from("community_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  assertOk(error);

  return count ?? 0;
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

/**
 * Permanently removes a post. Returns the deleted row, or `null` if the id was not there.
 *
 * A hard delete, unlike an article's archive: `community_posts.status` is constrained to
 * pending/approved/rejected, so there is no archived state to move a row into without a
 * migration on the shared project. Rejecting already hides a post — delete exists for the
 * case where the row itself must go, such as a supporter withdrawing consent.
 *
 * @param {string} id
 * @returns {Promise<{ id: string } | null>}
 */
async function remove(id) {
  const { data, error } = await getSupabase()
    .from("community_posts")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  assertOk(error);

  return data ?? null;
}

module.exports = {
  listApproved,
  listByStatus,
  countByStatus,
  create,
  moderate,
  remove,
  PUBLIC_COLUMNS,
  ADMIN_COLUMNS,
};
