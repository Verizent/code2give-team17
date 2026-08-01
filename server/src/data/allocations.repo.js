const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

/**
 * Bulk insert of donation_allocations. Called by allocation.service after eligible
 * sessions are picked; the caller is responsible for building rows with donor_period_id
 * and cost_at_allocation already snapshotted.
 *
 * @param {Array<{ donation_id: string, session_id: string, donor_period_id: string,
 *   cost_at_allocation: number, status?: string }>} rows
 * @returns {Promise<object[]>}
 */
async function insertMany(rows) {
  if (rows.length === 0) return [];
  const { data, error } = await getSupabase()
    .from("donation_allocations")
    .insert(rows)
    .select(
      "id, donation_id, session_id, donor_period_id, cost_at_allocation, status, created_at",
    );

  assertOk(error);
  return data ?? [];
}

/**
 * Every allocation belonging to a donor, joined enough to feed the track endpoint.
 * §15's lifetime strip and edition list both derive from this — computed on read,
 * never stored as counters.
 *
 * @param {string} donorId
 * @returns {Promise<object[]>}
 */
async function listByDonor(donorId) {
  const { data, error } = await getSupabase()
    .from("donation_allocations")
    .select(
      `
      id, session_id, donor_period_id, cost_at_allocation, status, created_at,
      donations!inner(donor_id, amount_hkd, created_at, status)
      `,
    )
    .eq("donations.donor_id", donorId);

  assertOk(error);
  return data ?? [];
}

/**
 * Allocations in a specific donor_period — the edition view.
 * @param {string} periodId
 * @returns {Promise<object[]>}
 */
async function listByPeriod(periodId) {
  const { data, error } = await getSupabase()
    .from("donation_allocations")
    .select("id, donation_id, session_id, cost_at_allocation, status, created_at")
    .eq("donor_period_id", periodId);

  assertOk(error);
  return data ?? [];
}

/**
 * Allocations still awaiting a session — pending-retry job (§16).
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
async function listPendingDonationsMissingAllocations(limit = 50) {
  const { data, error } = await getSupabase().rpc("noop"); // placeholder to keep the shape;
  // In practice the pending-retry job queries `donations` where status='succeeded' and
  // events_credited > 0 and no matching allocations. That query lives in donations.repo
  // to keep this repo focused on the allocations table. Left as a placeholder.
  return data ?? [];
}

/**
 * @param {string} id
 * @param {object} updates
 */
async function updateAllocation(id, updates) {
  const { error } = await getSupabase()
    .from("donation_allocations")
    .update(updates)
    .eq("id", id);
  assertOk(error);
}

/**
 * Advance every allocation on a donation through the state machine.
 * DEMO-ONLY: used by POST /api/admin/demo/advance-donation/:id — real state changes come
 * from session lifecycle events (session_scheduled → session_completed) and the
 * auto-complete cron.
 *
 * @param {string} donationId
 * @param {'planned'|'completed'} status
 */
async function bulkSetStatusForDonation(donationId, status) {
  const { error } = await getSupabase()
    .from("donation_allocations")
    .update({ status })
    .eq("donation_id", donationId);
  assertOk(error);
}

module.exports = {
  insertMany,
  listByDonor,
  listByPeriod,
  listPendingDonationsMissingAllocations,
  updateAllocation,
  bulkSetStatusForDonation,
};
