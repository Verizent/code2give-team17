const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

const COLUMNS = [
  "id",
  "title",
  "programme",
  "captured_at",
  "consent",
  "members_visible",
  "members_blurred",
  "thumb_url",
  "status",
  "approved_at",
  "fanout",
  "created_at",
  "updated_at",
].join(", ");

/**
 * @returns {Promise<object[]>}
 */
async function listAll() {
  const { data, error } = await getSupabase()
    .from("session_proofs")
    .select(COLUMNS)
    .order("captured_at", { ascending: false });
  assertOk(error);
  return data ?? [];
}

/**
 * @param {string} status
 * @returns {Promise<object[]>}
 */
async function listByStatus(status) {
  const { data, error } = await getSupabase()
    .from("session_proofs")
    .select(COLUMNS)
    .eq("status", status)
    .order("captured_at", { ascending: false });
  assertOk(error);
  return data ?? [];
}

/**
 * @param {string} id
 * @returns {Promise<object | null>}
 */
async function findById(id) {
  const { data, error } = await getSupabase()
    .from("session_proofs")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  assertOk(error);
  return data ?? null;
}

/**
 * @param {string} id
 * @param {{ status: string, approved_at: string, fanout: object }} patch
 * @returns {Promise<object>}
 */
async function updateApproval(id, patch) {
  const { data, error } = await getSupabase()
    .from("session_proofs")
    .update({
      status: patch.status,
      approved_at: patch.approved_at,
      fanout: patch.fanout,
    })
    .eq("id", id)
    .select(COLUMNS)
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
    .from("session_proofs")
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  assertOk(error);
  return count ?? 0;
}

module.exports = {
  listAll,
  listByStatus,
  findById,
  updateApproval,
  countByStatus,
  COLUMNS,
};
