const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

/**
 * Finds or opens the donor_period covering a given calendar window.
 *
 * §15: periods are per-donor rolling windows. This branch pins the window to the
 * fixed calendar in donation-periods.js — so a donation on 5 Aug attaches to a period
 * whose window is [15 Aug, 31 Aug), regardless of when the donor last had one open.
 * That means "the period for this window" is the right lookup, not "the currently
 * open one".
 *
 * @param {{ donorId: string, windowStart: Date, windowEnd: Date }} opts
 * @returns {Promise<object>}
 */
async function findOrOpenForDonorWindow({ donorId, windowStart, windowEnd }) {
  const start = windowStart.toISOString().slice(0, 10); // date-only
  const end = windowEnd.toISOString().slice(0, 10);

  const supabase = getSupabase();

  const { data: existing, error: findErr } = await supabase
    .from("donor_periods")
    .select("id, donor_id, period_start, period_end, status, emailed_at")
    .eq("donor_id", donorId)
    .eq("period_start", start)
    .eq("period_end", end)
    .maybeSingle();

  assertOk(findErr);
  if (existing) return existing;

  const { data: created, error: insertErr } = await supabase
    .from("donor_periods")
    .insert({
      donor_id: donorId,
      period_start: start,
      period_end: end,
      status: "open",
    })
    .select("id, donor_id, period_start, period_end, status, emailed_at")
    .single();

  assertOk(insertErr);
  return created;
}

/**
 * @param {string} donorId
 * @returns {Promise<object[]>}
 */
async function listByDonor(donorId) {
  const { data, error } = await getSupabase()
    .from("donor_periods")
    .select("id, period_start, period_end, status, emailed_at")
    .eq("donor_id", donorId)
    .order("period_start", { ascending: false });

  assertOk(error);
  return data ?? [];
}

/**
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const { data, error } = await getSupabase()
    .from("donor_periods")
    .select("id, donor_id, period_start, period_end, status, emailed_at")
    .eq("id", id)
    .maybeSingle();

  assertOk(error);
  return data;
}

/**
 * Periods due for closing — end date is on or before `today` and status is still open.
 * §16 cron / manual "run now" trigger.
 *
 * @param {Date} today
 * @returns {Promise<object[]>}
 */
async function listDueForClose(today) {
  const dateOnly = today.toISOString().slice(0, 10);
  const { data, error } = await getSupabase()
    .from("donor_periods")
    .select("id, donor_id, period_start, period_end")
    .eq("status", "open")
    .lte("period_end", dateOnly);

  assertOk(error);
  return data ?? [];
}

/**
 * @param {string} id
 * @param {object} updates
 */
async function updatePeriod(id, updates) {
  const { error } = await getSupabase().from("donor_periods").update(updates).eq("id", id);
  assertOk(error);
}

module.exports = {
  findOrOpenForDonorWindow,
  listByDonor,
  findById,
  listDueForClose,
  updatePeriod,
};
