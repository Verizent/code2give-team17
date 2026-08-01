const crypto = require("node:crypto");
const donorsRepo = require("../data/donors.repo");
const donationsRepo = require("../data/donations.repo");
const allocationsRepo = require("../data/allocations.repo");
const donorPeriodsRepo = require("../data/donor-periods.repo");
const sessionsRepo = require("../data/sessions.repo");
const { normalizeEmail } = require("../lib/normalize");

function newAccessToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Upserts a donor keyed on normalised email (CONTEXT.md §15).
 * A returning email resolves to the existing row and token — never split history.
 *
 * @param {{ email: string, fullName?: string, locale?: string, trackingOptIn?: boolean }} opts
 * @returns {Promise<{ id: string, email: string, access_token: string, full_name: string|null }>}
 */
async function upsertDonor({ email, fullName, locale = "en", trackingOptIn = true }) {
  const normalized = normalizeEmail(email);
  const existing = await donorsRepo.findByEmail(normalized);

  if (existing) {
    const updates = {};
    if (trackingOptIn && !existing.tracking_opt_in) updates.tracking_opt_in = true;
    if (fullName && !existing.full_name) updates.full_name = fullName;
    if (Object.keys(updates).length > 0) {
      await donorsRepo.updateDonor(existing.id, updates);
    }
    return existing;
  }

  return donorsRepo.createDonor({
    email: normalized,
    full_name: fullName ?? null,
    locale,
    access_token: newAccessToken(),
    tracking_opt_in: trackingOptIn,
  });
}

/**
 * @param {string} token
 * @returns {Promise<object|null>}
 */
async function findDonorByToken(token) {
  return donorsRepo.findByToken(token);
}

/**
 * Composes the §15 tracking-page response: donor identity, lifetime strip,
 * the requested (or default) edition, and the allocations within it.
 *
 * Lifetime fields are computed on read, never stored as counters — that way a
 * later data correction never has to sweep denormalised aggregates:
 *  • sessions_supported = COUNT(DISTINCT session_id) over completed allocations
 *  • on_the_way         = COUNT(DISTINCT session_id) over pending + planned
 *  • total_given        = SUM(amount_hkd) over succeeded donations
 *  • supporter_since    = MIN(created_at) over succeeded donations
 *
 * Edition selection:
 *  • If `periodId` is supplied, load that specific period (archived editions stay
 *    reachable via `?period=<id>`, §15).
 *  • Otherwise, default to the most recent one — the current open edition, or
 *    the most recent closed edition if none is open.
 *  • If the donor has no periods yet (opted-in first-timer whose allocations
 *    haven't been created — allocation runs in the webhook, but a race is possible),
 *    the response still populates the strip from the donations, and edition is null.
 *
 * @param {{ id: string, email: string, full_name: string|null, locale?: string }} donor
 * @param {{ periodId?: string }} [opts]
 */
async function buildTrackView(donor, opts = {}) {
  const [allocations, donations, periods] = await Promise.all([
    allocationsRepo.listByDonor(donor.id),
    donationsRepo.listByDonor(donor.id),
    donorPeriodsRepo.listByDonor(donor.id),
  ]);

  const lifetime = computeLifetime(allocations, donations);
  const edition = selectEdition(periods, opts.periodId);

  let editionAllocations = [];
  if (edition) {
    const inEdition = allocations.filter((a) => a.donor_period_id === edition.id);
    const sessionIds = [...new Set(inEdition.map((a) => a.session_id))];
    const sessions = await sessionsRepo.listByIds(sessionIds);
    const sessionsById = new Map(sessions.map((s) => [s.id, s]));
    editionAllocations = inEdition
      .map((a) => ({
        id: a.id,
        status: a.status,
        cost_at_allocation: a.cost_at_allocation,
        session: sessionsById.get(a.session_id) ?? { id: a.session_id },
      }))
      .filter((a) => a.session);
  }

  return {
    donor: {
      email: donor.email,
      full_name: donor.full_name,
      locale: donor.locale ?? "en",
    },
    lifetime,
    edition: edition
      ? {
          id: edition.id,
          period_start: edition.period_start,
          period_end: edition.period_end,
          status: edition.status,
        }
      : null,
    allocations: editionAllocations,
  };
}

function computeLifetime(allocations, donations) {
  const completedSessions = new Set();
  const onTheWaySessions = new Set();
  for (const a of allocations) {
    if (a.status === "completed") completedSessions.add(a.session_id);
    if (a.status === "pending" || a.status === "planned") onTheWaySessions.add(a.session_id);
  }

  const succeeded = donations.filter((d) => d.status === "succeeded");
  const totalGiven = succeeded.reduce((sum, d) => sum + Number(d.amount_hkd || 0), 0);
  const supporterSince = succeeded.length
    ? succeeded.reduce(
        (min, d) => (min && min < d.created_at ? min : d.created_at),
        null,
      )
    : null;

  return {
    sessions_supported: completedSessions.size,
    on_the_way: onTheWaySessions.size,
    total_given: totalGiven,
    supporter_since: supporterSince,
  };
}

function selectEdition(periods, requestedId) {
  if (requestedId) {
    return periods.find((p) => p.id === requestedId) ?? null;
  }
  if (periods.length === 0) return null;
  // listByDonor orders by period_start desc — first is most recent.
  const open = periods.find((p) => p.status === "open");
  return open ?? periods[0];
}

module.exports = { upsertDonor, findDonorByToken, newAccessToken, buildTrackView };
