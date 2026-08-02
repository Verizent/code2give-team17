const crypto = require("node:crypto");
const donorsRepo = require("../data/donors.repo");
const donationsRepo = require("../data/donations.repo");
const allocationsRepo = require("../data/allocations.repo");
const donorPeriodsRepo = require("../data/donor-periods.repo");
const sessionsRepo = require("../data/sessions.repo");
const { normalizeEmail } = require("../lib/normalize");
const { resolveLocale } = require("../lib/locale");
const {
  editionForDonation,
  MONTH_ABBREVIATIONS,
  MAX_EVENTS_SHOWN,
} = require("../lib/donation-periods");
const { MAX_EVENTS_SHOWN: MAX_SHOWN_FALLBACK } = require("../lib/donation-credit");

function newAccessToken() {
  return crypto.randomBytes(32).toString("hex");
}

/** Mirrors donors_referral_sources_check. Keep the two in step. */
const REFERRAL_SOURCES = [
  "friend_family",
  "social",
  "edm",
  "company",
  "event",
  "press",
  "search",
  "other",
];

/**
 * Drops unknown values and duplicates rather than letting them reach the CHECK constraint.
 *
 * These arrive via Stripe session metadata, which is a round trip through a third party we
 * do not control — so what comes back is treated as untrusted input, not as the array we
 * sent. A rejected write here would fail the webhook and un-succeed a donation that was
 * genuinely paid, which is far worse than dropping an unrecognised tag.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
function sanitiseReferralSources(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry) => REFERRAL_SOURCES.includes(entry)))];
}

/**
 * Upserts a donor keyed on normalised email (CONTEXT.md §15).
 * A returning email resolves to the existing row and token — never split history.
 *
 * @param {{ email: string, fullName?: string, locale?: string, trackingOptIn?: boolean }} opts
 * @returns {Promise<{ id: string, email: string, access_token: string, full_name: string|null }>}
 */
async function upsertDonor({
  email,
  fullName,
  locale = "en",
  trackingOptIn = true,
  referralSources,
  referralSourceOther,
}) {
  const normalized = normalizeEmail(email);
  const existing = await donorsRepo.findByEmail(normalized);
  const sources = sanitiseReferralSources(referralSources);

  if (existing) {
    const updates = {};
    // Asked once per donor, never re-asked and never rewritten. The donate form hides the
    // question once an answer exists, but that is only a UI courtesy — this is the rule.
    // Without it a later gift would overwrite the original answer, and because the payer
    // email comes from Stripe rather than from us, so could anyone paying on that address.
    if (sources.length > 0 && !(existing.referral_sources?.length > 0)) {
      updates.referral_sources = sources;
      if (sources.includes("other") && referralSourceOther) {
        updates.referral_source_other = String(referralSourceOther).slice(0, 200);
      }
    }
    // `tracking_opt_in` is deliberately NOT updated for an existing donor. Consent is not
    // a side effect of somebody else donating: POST /api/donations and the wishlist pledge
    // form are both unauthenticated and take an arbitrary email, so this previously let a
    // third party flip an opted-out supporter back to opted-in by submitting their address.
    // Opting back in is a deliberate act belonging to the donor. `trackingOptIn` therefore
    // only applies on the create path below.
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
    referral_sources: sources,
    referral_source_other:
      sources.includes("other") && referralSourceOther
        ? String(referralSourceOther).slice(0, 200)
        : null,
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

  // This view never expires. The token is the donor's only route back — §15 has no
  // lookup-by-email and the link is delivered once, by email — so an expiring page would take
  // their giving history away for good. A period with nothing outstanding means no *new* news,
  // not that the record should stop existing.

  const succeeded = donations.filter((d) => d.status === "succeeded");
  const supporterSince = succeeded.length
    ? succeeded.reduce(
        (min, d) => (min && min < d.created_at ? min : d.created_at),
        null,
      )
    : null;

  // people_reached: total attendance across completed sessions the donor supported.
  // Load these sessions once here so buildLifetime and buildPeriodBlock share the same map.
  const completedSessionIds = [
    ...new Set(
      allocations.filter((a) => a.status === "completed").map((a) => a.session_id),
    ),
  ];
  const completedSessions = completedSessionIds.length
    ? await sessionsRepo.listByIds(completedSessionIds)
    : [];

  const period = selectPeriod(periods, opts.periodId);
  const periodBlock = period
    ? await buildPeriodBlock({ period, allocations, succeeded, donor })
    : null;

  return {
    donor: {
      full_name: donor.full_name,
      supporter_since: supporterSince,
    },
    lifetime: buildLifetime(allocations, succeeded, completedSessions),
    period: periodBlock,
    periods: periods.map(toArchiveEntry),
  };
}

function buildLifetime(allocations, succeeded, completedSessionRows = []) {
  const completedIds = new Set();
  const onTheWayIds = new Set();
  for (const a of allocations) {
    if (a.status === "completed") completedIds.add(a.session_id);
    if (a.status === "pending" || a.status === "planned") onTheWayIds.add(a.session_id);
  }

  // people_reached: SUM(attendance_count) over the distinct completed sessions.
  // Null attendance counts as 0 — session ran but staff haven't recorded headcount yet;
  // truthful under-count is better than dropping it from the total entirely.
  const peopleReached = completedSessionRows
    .filter((s) => completedIds.has(s.id))
    .reduce((sum, s) => sum + (Number(s.attendance_count) || 0), 0);

  return {
    sessions_supported: completedIds.size,
    sessions_on_the_way: onTheWayIds.size,
    total_given_hkd: succeeded.reduce((sum, d) => sum + Number(d.amount_hkd || 0), 0),
    donation_count: succeeded.length,
    people_reached: peopleReached,
  };
}

/** Mark-for-removal window: an allocation whose completion email fired more than
 *  this long ago is removed from the current-period display (spec: "removed by
 *  next 15th/28th"). Lifetime totals still count it — it was supported.  */
const REMOVAL_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * `donor_periods.period_start` / `period_end` are date-only columns, so edition windows must
 * be compared in the same form — `donor-periods.repo.js` stores them with this exact slice.
 *
 * @param {Date} date
 * @returns {string} `YYYY-MM-DD`
 */
function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

async function buildPeriodBlock({ period, allocations, succeeded, donor }) {
  const removalCutoff = new Date(Date.now() - REMOVAL_WINDOW_MS);
  const inPeriod = allocations
    .filter((a) => a.donor_period_id === period.id)
    // Display filter: keep items whose email is unsent OR sent within the last 14 days.
    .filter(
      (a) => !a.email_sent_at || new Date(a.email_sent_at) >= removalCutoff,
    );
  const sessionIds = [...new Set(inPeriod.map((a) => a.session_id))];
  const sessions = sessionIds.length ? await sessionsRepo.listByIds(sessionIds) : [];
  const sessionsById = new Map(sessions.map((s) => [s.id, s]));

  // Display cap of 10 per PLAN.md — the first N by starts_at.
  const cap = typeof MAX_EVENTS_SHOWN === "number" ? MAX_EVENTS_SHOWN : (MAX_SHOWN_FALLBACK ?? 10);

  // One row per SESSION, not per allocation. Two allocations land on the same session
  // whenever a donor gives twice inside one eligibility window — the allocator picks
  // soonest-first and does not exclude what an earlier gift already funded — and mapping over
  // allocations then rendered that session twice. A donor seeing "Family support circle"
  // listed twice reads it as us double-counting their money.
  //
  // `sessionIds` is already distinct and already carries the removal-window filter, since it
  // is derived from `inPeriod`. It was being used for the fetch and then ignored for the
  // render. The identical bug in the edition email was fixed in period-close.service.js; this
  // is the same defect on the page.
  const events = sessionIds
    .map((id) => sessionsById.get(id))
    .filter(Boolean)
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    .slice(0, cap)
    .map((s) => toEvent(s, donor.locale ?? "en"));

  // events_credited: what the gifts belonging to this edition actually bought.
  //
  // A donation belongs to the period its *edition* maps to — not the period whose window
  // contains its `created_at`. Under the fixed calendar those are deliberately different: a
  // gift made on the 2nd is credited to the edition covering the 15th–EOM, so it is never
  // inside its own period's window. The previous `created_at >= start && < end` test was
  // therefore false for every gift in the 1st–15th bucket and this figure was always 0,
  // while `events_shown` sat beside it reporting 5.
  //
  // `editionForDonation` is the same mapping allocation.service.js uses to pick the period,
  // so the two cannot drift apart.
  const eventsCredited = succeeded
    .filter((d) => {
      const edition = editionForDonation(d.created_at);
      return (
        toDateOnly(edition.windowStart) === period.period_start &&
        toDateOnly(edition.windowEnd) === period.period_end
      );
    })
    .reduce((sum, d) => sum + Number(d.events_credited || 0), 0);

  return {
    id: period.id,
    period_start: period.period_start,
    // **Exclusive**, and therefore also the day the edition email goes out — the window is
    // half-open `[period_start, period_end)`. Both fields are internal batching detail; the
    // donor-facing value is `sends_on`.
    period_end: period.period_end,
    /** When the donor hears what happened. Same instant as `period_end`, named for its use. */
    sends_on: period.period_end,
    // e.g. "31 Aug". Identifies the period by when we write, not by the window it spans —
    // see labelForPeriod. Carried here so a caller never has to find its own period in the
    // archive to title the block, a lookup that returns nothing for an archived period the
    // list does not contain.
    label: labelForPeriod(period),
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
    // `sessions` has no `expected_participants` column and is not getting one — it belongs
    // to the admin track. `capacity` stands in by team decision: it is the planned headcount
    // for a scheduled session, which is what the donor page needs before the event runs.
    // Distinct from `attendance_count` below, which is who actually came. Never collapse the
    // two — a completed event's headcount must stay a fact, not silently become a plan.
    expected_participants: session.capacity ?? null,
    attendance_count: session.attendance_count ?? null,
    photo_url: session.photo_url ?? null,
  };
}

/**
 * A period is identified to the donor by **when we write to them**, not by the window it
 * spans.
 *
 * The window ("15 Aug – 30 Aug") is an internal batching rule: which gifts get grouped into
 * which email. It was being rendered directly above the session list, where it reads as a
 * claim about those sessions — and it is not one. Sessions are chosen by a different rule
 * entirely (`[donation +7d, +30d]` in allocation.service.js), so a gift on 2 Aug shows
 * sessions on the 10th and 11th beneath a heading saying 15–30 Aug. Two unrelated windows,
 * one stacked on the other.
 *
 * `period_end` is that send date — the window is half-open, so its exclusive end IS the day
 * the email goes out. "31 Aug" answers the question a donor actually has: when will I hear
 * what happened?
 *
 * @param {{ period_end: string }} period
 * @returns {string} e.g. `"31 Aug"`
 */
function labelForPeriod(period) {
  const sends = new Date(`${period.period_end}T00:00:00Z`);
  return `${sends.getUTCDate()} ${MONTH_ABBREVIATIONS[sends.getUTCMonth()]}`;
}

function toArchiveEntry(period) {
  return {
    id: period.id,
    label: labelForPeriod(period),
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

module.exports = {
  upsertDonor,
  findDonorByToken,
  newAccessToken,
  buildTrackView,
  sanitiseReferralSources,
  REFERRAL_SOURCES,
};
