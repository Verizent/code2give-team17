const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

const COLUMNS = [
  "id",
  "channel",
  "lang",
  "caption",
  "status",
  "scheduled_for",
  "proof_id",
  "created_at",
  "updated_at",
].join(", ");

/**
 * @returns {Promise<object[]>}
 */
async function listAll() {
  const { data, error } = await getSupabase()
    .from("social_drafts")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  assertOk(error);
  return data ?? [];
}

/**
 * @param {string} id
 * @returns {Promise<object | null>}
 */
async function findById(id) {
  const { data, error } = await getSupabase()
    .from("social_drafts")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  assertOk(error);
  return data ?? null;
}

/**
 * @param {Array<{
 *   channel: string,
 *   lang: string,
 *   caption: string,
 *   status?: string,
 *   scheduled_for?: string | null,
 *   proof_id?: string | null,
 * }>} rows
 * @returns {Promise<object[]>}
 */
async function insertMany(rows) {
  if (!rows.length) return [];
  const { data, error } = await getSupabase()
    .from("social_drafts")
    .insert(
      rows.map((row) => ({
        channel: row.channel,
        lang: row.lang,
        caption: row.caption,
        status: row.status ?? "draft",
        scheduled_for: row.scheduled_for ?? null,
        proof_id: row.proof_id ?? null,
      })),
    )
    .select(COLUMNS);
  assertOk(error);
  return data ?? [];
}

/**
 * @param {string} id
 * @param {{ scheduled_for?: string | null, status?: string }} patch
 * @returns {Promise<object>}
 */
async function update(id, patch) {
  /** @type {Record<string, unknown>} */
  const body = {};
  if (patch.scheduled_for !== undefined) body.scheduled_for = patch.scheduled_for;
  if (patch.status !== undefined) body.status = patch.status;

  const { data, error } = await getSupabase()
    .from("social_drafts")
    .update(body)
    .eq("id", id)
    .select(COLUMNS)
    .single();
  assertOk(error);
  return data;
}

/**
 * @param {string} proofId
 * @returns {Promise<number>}
 */
async function countByProofId(proofId) {
  const { count, error } = await getSupabase()
    .from("social_drafts")
    .select("id", { count: "exact", head: true })
    .eq("proof_id", proofId);
  assertOk(error);
  return count ?? 0;
}

module.exports = {
  listAll,
  findById,
  insertMany,
  update,
  countByProofId,
  COLUMNS,
};
