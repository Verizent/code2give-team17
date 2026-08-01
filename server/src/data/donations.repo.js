const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

const COLUMNS = [
  "id",
  "donor_id",
  "amount_hkd",
  "frequency",
  "programme",
  "campaign_id",
  "status",
  "created_at",
  "updated_at",
].join(", ");

/**
 * @param {{ donor_id: string, amount_hkd: number, frequency: string, programme: string, campaign_id?: string | null, status?: string }} input
 * @returns {Promise<object>}
 */
async function insert(input) {
  const { data, error } = await getSupabase()
    .from("donations")
    .insert({
      donor_id: input.donor_id,
      amount_hkd: input.amount_hkd,
      frequency: input.frequency,
      programme: input.programme,
      campaign_id: input.campaign_id ?? null,
      status: input.status ?? "pending",
    })
    .select(COLUMNS)
    .single();
  assertOk(error);
  return data;
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
  return data ?? [];
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
  return data;
}

module.exports = { insert, listByDonorId, findById };
