const crypto = require("node:crypto");
const donorsRepo = require("../data/donors.repo");
const donationsRepo = require("../data/donations.repo");
const allocationsRepo = require("../data/allocations.repo");
const donorPeriodsRepo = require("../data/donor-periods.repo");
const sessionsRepo = require("../data/sessions.repo");
const { normalizeEmail } = require("../lib/normalize");
const { resolveLocale } = require("../lib/locale");
const { editionLabel, MAX_EVENTS_SHOWN } = require("../lib/donation-periods");
const { MAX_EVENTS_SHOWN: MAX_SHOWN_FALLBACK } = require("../lib/donation-credit");

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
 * Composes the §15 / PLAN.md §C1 tracking-page response.
 *
 * PLAN.md shape (this is what FE3 builds against):
 *   donor.supporter_since       — moved out of lifetime
 *   lifetime.sessions_supported — DISTINCT completed
 *   lifetime.sessions_on_the_way— DISTINCT pending + planned
 *   lifetime.total_given_hkd    — SUM succeeded amounts
 *   lifetime.donation_count     — COUNT succeeded donations
 *   period.{id, period_start, period_end, status, is_current,
 *           events_credited, events_shown, events[]}
 *   period.events[] carries session-level state
 *                   ({kind, id, title, starts_at, location, status,
 *                     expected_participants, attendance_count, photo_url})
 *   periods[] — archive list, newest first, with human labels
 *
 * There is NO `allocations` key. PLAN.md §Phase B deletes distributed allocation;
 * the internal table is a compromise on this branch (Option C) but is invisible
 * outside this service. An event's status is the session's own
 * `scheduled | completed | cancelled` — never the allocation's `pending | planned`.
 *
 * Lifetime fields are computed on read (§15 invariant).
 *
 * @param {{ id: string, full_name: string|null, locale?: string }} donor
 * @param {{ periodId?: string }} [opts]
 */
async function buildTrackView(donor, opts = {}) {
  const [allocations, donations, periods] = await Promise.all([
    allocationsRepo.listByDonor(donor.id),
    donationsRepo.listByDonor(donor.id),
    donorPeriodsRepo.listByDonor(donor.id),
  ]);

  const succeeded = donations.filter((d) => d.status === "succeeded");
  const supporterSince = succeeded.length
    ? succeeded.reduce(
        (min, d) => (min && min < d.created_at ? min : d.created_at),
        null,
      )
    : null;

  const period = selectPeriod(periods, opts.periodId);
  const periodBlock = period
    ? await buildPeriodBlock({ period, allocations, succeeded, donor })
    : null;

  return {
    donor: {
      full_name: donor.full_name,
      supporter_since: supporterSince,
    },
    lifetime: buildLifetime(allocations, succeeded),
    period: periodBlock,
    periods: periods.map(toArchiveEntry),
  };
}

function buildLifetime(allocations, succeeded) {
  const completedSessions = new Set();
  const onTheWaySessions = new Set();
  for (const a of allocations) {
    if (a.status === "completed") completedSessions.add(a.session_id);
    if (a.status === "pending" || a.status === "planned") onTheWaySessions.add(a.session_id);
  }

  return {
    sessions_supported: completedSessions.size,
    sessions_on_the_way: onTheWaySessions.size,
    total_given_hkd: succeeded.reduce((sum, d) => sum + Number(d.amount_hkd || 0), 0),
    donation_count: succeeded.length,
  };
}

async function buildPeriodBlock({ period, allocations, succeeded, donor }) {
  const inPeriod = allocations.filter((a) => a.donor_period_id === period.id);
  const sessionIds = [...new Set(inPeriod.map((a) => a.session_id))];
  const sessions = sessionIds.length ? await sessionsRepo.listByIds(sessionIds) : [];
  const sessionsById = new Map(sessions.map((s) => [s.id, s]));

  // Display cap of 10 per PLAN.md — the first N by starts_at.
  const cap = typeof MAX_EVENTS_SHOWN === "number" ? MAX_EVENTS_SHOWN : (MAX_SHOWN_FALLBACK ?? 10);
  const events = inPeriod
    .map((alloc) => sessionsById.get(alloc.session_id))
    .filter(Boolean)
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    .slice(0, cap)
    .map((s) => toEvent(s, donor.locale ?? "en"));

  // events_credited: sum from succeeded donations whose created_at falls in [start, end).
  const start = new Date(period.period_start);
  const end = new Date(period.period_end);
  const eventsCredited = succeeded
    .filter((d) => {
      const c = new Date(d.created_at);
      return c >= start && c < end;
    })
    .reduce((sum, d) => sum + Number(d.events_credited || 0), 0);

  return {
    id: period.id,
    period_start: period.period_start,
    period_end: period.period_end,
    status: period.status,
    is_current: period.status === "open",
    events_credited: eventsCredited,
    events_shown: events.length,
    events,
  };
}

function toEvent(session, locale) {
  const resolved = resolveLocale(session, ["title", "location"], locale);
  return {
    kind: "session",
    id: session.id,
    title: resolved.title ?? null,
    starts_at: session.starts_at,
    location: resolved.location ?? null,
    // Session's own status per PLAN.md §Phase B — never the allocation's status.
    status: session.status ?? "scheduled",
    // Column doesn't exist on sessions yet (PLAN.md flags as future work) — safe null.
    expected_participants: session.expected_participants ?? null,
    attendance_count: session.attendance_count ?? null,
    photo_url: session.photo_url ?? null,
  };
}

function toArchiveEntry(period) {
  return {
    id: period.id,
    label: editionLabel({
      windowStart: new Date(period.period_start),
      windowEnd: new Date(period.period_end),
    }),
    status: period.status,
  };
}

function selectPeriod(periods, requestedId) {
  if (requestedId) {
    return periods.find((p) => p.id === requestedId) ?? null;
  }
  if (periods.length === 0) return null;
  // listByDonor orders by period_start desc — first is most recent.
  const open = periods.find((p) => p.status === "open");
  return open ?? periods[0];
}

module.exports = { upsertDonor, findDonorByToken, newAccessToken, buildTrackView };
