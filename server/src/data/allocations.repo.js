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
      id, session_id, donor_period_id, cost_at_allocation, status, email_sent_at, created_at,
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
    .select("id, donation_id, session_id, cost_at_allocation, status, email_sent_at, created_at")
    .eq("donor_period_id", periodId);

  assertOk(error);
  return data ?? [];
}

/**
 * Every allocation pointing at one session, with the donor reachable through the donation.
 *
 * The embedded `donations(donor_id)` join is what makes "a session finished — who paid for
 * it?" one query instead of N. `donation_allocations` has no `donor_id` of its own; the donor
 * is only reachable through `donation_id`.
 *
 * @param {string} sessionId
 * @returns {Promise<object[]>}
 */
async function listBySession(sessionId) {
  const { data, error } = await getSupabase()
    .from("donation_allocations")
    .select(
      "id, donation_id, session_id, donor_period_id, status, email_sent_at, donations(donor_id)",
    )
    .eq("session_id", sessionId);

  assertOk(error);
  return (data ?? []).map((row) => ({
    ...row,
    donor_id: row.donations?.donor_id ?? null,
  }));
}

/**
 * Aggregate stats for the admin dashboard — donation totals, distinct donors,
 * total sessions ever supported, total people ever reached.
 * @returns {Promise<{donation_count:number, donor_count:number, total_given_hkd:number, sessions_supported:number, people_reached:number}>}
 */
async function adminStats() {
  const supabase = getSupabase();
  const [donationsResult, donorsResult, allocationsResult, sessionsResult] = await Promise.all([
    supabase.from("donations").select("donor_id, amount_hkd, status").eq("status", "succeeded"),
    supabase.from("donors").select("id"),
    supabase.from("donation_allocations").select("session_id, status").eq("status", "completed"),
    supabase.from("sessions").select("id, attendance_count").eq("status", "completed"),
  ]);
  assertOk(donationsResult.error);
  assertOk(donorsResult.error);
  assertOk(allocationsResult.error);
  assertOk(sessionsResult.error);

  const succeeded = donationsResult.data ?? [];
  const donors = donorsResult.data ?? [];
  const allocs = allocationsResult.data ?? [];
  const sessions = sessionsResult.data ?? [];

  const supportedIds = new Set(allocs.map((a) => a.session_id));
  const attendanceById = new Map(sessions.map((s) => [s.id, Number(s.attendance_count) || 0]));
  const peopleReached = [...supportedIds].reduce(
    (sum, id) => sum + (attendanceById.get(id) ?? 0),
    0,
  );

  return {
    donation_count: succeeded.length,
    donor_count: donors.length,
    total_given_hkd: succeeded.reduce((s, d) => s + Number(d.amount_hkd || 0), 0),
    sessions_supported: supportedIds.size,
    people_reached: peopleReached,
  };
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
  listBySession,
  listPendingDonationsMissingAllocations,
  updateAllocation,
  bulkSetStatusForDonation,
  adminStats,
};
