const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

// Live `donations` table (shared project) has no `programme` / `designation`
// column yet — CONTEXT §13 still describes them. Do not select missing cols.
const COLUMNS = [
  "id",
  "donor_id",
  "amount_hkd",
  "frequency",
  "campaign_id",
  "status",
  "is_anonymous",
  "message",
  "referral_source",
  "referral_source_other",
  "created_at",
  "updated_at",
].join(", ");

/**
 * @param {{
 *   donor_id: string,
 *   amount_hkd: number,
 *   frequency: string,
 *   programme?: string | null,
 *   campaign_id?: string | null,
 *   status?: string,
 *   message?: string | null,
 * }} input
 * @returns {Promise<object>}
 */
async function insert(input) {
  const row = {
    donor_id: input.donor_id,
    amount_hkd: input.amount_hkd,
    frequency: input.frequency,
    campaign_id: input.campaign_id ?? null,
    status: input.status ?? "pending",
  };
  // Stash programme intent in message until the column lands (demo-safe).
  if (input.programme && !input.message) {
    row.message = `programme:${input.programme}`;
  } else if (input.message) {
    row.message = input.message;
  }

  const { data, error } = await getSupabase()
    .from("donations")
    .insert(row)
    .select(COLUMNS)
    .single();
  assertOk(error);
  return withProgramme(data);
}

/**
 * Recover programme from the temporary message stash, if present.
 * @param {object | null} row
 */
function withProgramme(row) {
  if (!row) return row;
  const msg = row.message;
  if (typeof msg === "string" && msg.startsWith("programme:")) {
    return { ...row, programme: msg.slice("programme:".length) };
  }
  return { ...row, programme: row.programme ?? null };
}

/**
 * @param {string} donorId
 * @returns {Promise<object[]>}
 */
async function listByDonorId(donorId) {
  const { data, error } = await getSupabase()
    .from("donations")
    .select(COLUMNS)
    .eq("donor_id", donorId)
    .order("created_at", { ascending: false });
  assertOk(error);
  return (data ?? []).map(withProgramme);
}

/**
 * @param {string} donationId
 * @returns {Promise<object | null>}
 */
async function findById(donationId) {
  const { data, error } = await getSupabase()
    .from("donations")
    .select(COLUMNS)
    .eq("id", donationId)
    .maybeSingle();
  assertOk(error);
  return withProgramme(data);
}

/**
 * Aggregate money metrics for the admin dashboard.
 * Counts succeeded + pending (in-flight) gifts; excludes failed/refunded.
 *
 * @returns {Promise<{ total_hkd: number, count: number }>}
 */
async function sumAmounts() {
  const { data, error } = await getSupabase()
    .from("donations")
    .select("amount_hkd, status");
  assertOk(error);
  const rows = data ?? [];
  let total_hkd = 0;
  let count = 0;
  for (const row of rows) {
    if (row.status === "failed" || row.status === "refunded") continue;
    total_hkd += Number(row.amount_hkd) || 0;
    count += 1;
  }
  return { total_hkd, count };
}

/**
 * Monthly donation totals for charting (last ~12 months of rows).
 *
 * @returns {Promise<Array<{ month: string, amount_hkd: number }>>}
 */
async function sumByMonth() {
  const { data, error } = await getSupabase()
    .from("donations")
    .select("amount_hkd, created_at, status")
    .order("created_at", { ascending: true });
  assertOk(error);

  /** @type {Map<string, number>} */
  const byMonth = new Map();
  for (const row of data ?? []) {
    if (row.status === "failed" || row.status === "refunded") continue;
    const month = String(row.created_at).slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + (Number(row.amount_hkd) || 0));
  }
  return [...byMonth.entries()].map(([month, amount_hkd]) => ({ month, amount_hkd }));
}

/**
 * @param {string} id
 * @param {string} status
 * @returns {Promise<object>}
 */
async function updateStatus(id, status) {
  const { data, error } = await getSupabase()
    .from("donations")
    .update({ status })
    .eq("id", id)
    .select(COLUMNS)
    .single();
  assertOk(error);
  return withProgramme(data);
}

/**
 * Recent donations (internal tooling / legacy demo advance picker).
 *
 * @param {number} [limit]
 * @returns {Promise<object[]>}
 */
async function listRecent(limit = 8) {
  const { data, error } = await getSupabase()
    .from("donations")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  assertOk(error);
  return (data ?? []).map(withProgramme);
}

/**
 * How donors said they found Love 21 (form answers, not UTMs).
 *
 * @returns {Promise<Array<{ source: string, count: number }>>}
 */
async function countByReferralSource() {
  const { data, error } = await getSupabase()
    .from("donations")
    .select("referral_source, status");
  assertOk(error);

  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const row of data ?? []) {
    if (row.status === "failed" || row.status === "refunded") continue;
    const source = row.referral_source || "unknown";
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }
  return [...counts.entries()].map(([source, count]) => ({ source, count }));
}

module.exports = {
  insert,
  listByDonorId,
  findById,
  sumAmounts,
  sumByMonth,
  updateStatus,
  listRecent,
  countByReferralSource,
  withProgramme,
};
