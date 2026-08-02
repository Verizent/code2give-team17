/**
 * Fortnightly editions on a fixed calendar (PLAN.md Phase B).
 *
 * Two batch sends a month. Which edition a gift belongs to is a pure function of the day it
 * was made — no per-donor timers, no scheduling state:
 *
 *   gift on 1st – 15th  → sends last day of that month, covers [15th, EOM)
 *   gift on 16th – EOM  → sends 15th of next month,     covers [EOM, 15th next)
 *
 * Every edition covers the half-open interval `[previous_send_date, this_send_date)`, so the
 * windows tile the calendar exactly and an edition never reports on an event happening the
 * day it sends — that day rolls into the next edition, where it is a settled fact.
 *
 * CONTEXT.md §15 rejects a global calendar because "a shared fortnight would email someone who
 * gave yesterday an almost-empty edition". That failure does not occur here: the boundaries are
 * staggered against the giving window, so the gap between a gift and its edition is 15–30 days,
 * never zero. Every gift lands in the *second* upcoming send, not the first.
 *
 * All arithmetic is UTC. Dates are the unit; a donation's time of day never matters.
 */

/** Milliseconds in a day — the selection floor below is expressed in days. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** CONTEXT.md §15: an event must not happen before the donor has read the email. */
const SELECTION_FLOOR_DAYS = 2;

/** @param {Date} date @returns {Date} midnight UTC on the same day */
function startOfDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * The last day of `date`'s month.
 *
 * "The 31st" is not a date — February has 28 or 29, and April, June, September and November
 * have 30. A job scheduled literally on the 31st skips five months a year.
 *
 * @param {Date} date
 * @returns {Date}
 */
function lastDayOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

/** @param {Date} date @returns {Date} the 15th of `date`'s month */
function fifteenthOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 15));
}

/** @param {Date} date @returns {Date} the 15th of the month after `date` */
function fifteenthOfNextMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 15));
}

/**
 * @typedef {object} Edition
 * @property {Date} sendDate     When the edition email goes out.
 * @property {Date} windowStart  First day covered, inclusive.
 * @property {Date} windowEnd    Exclusive — equals `sendDate`, so the send day is never covered.
 */

/**
 * The edition a donation belongs to.
 *
 * @param {Date|string} donatedAt
 * @returns {Edition}
 */
function editionForDonation(donatedAt) {
  const madeOn = startOfDay(new Date(donatedAt));
  const dayOfMonth = madeOn.getUTCDate();

  if (dayOfMonth <= 15) {
    const sendDate = lastDayOfMonth(madeOn);
    return { sendDate, windowStart: fifteenthOfMonth(madeOn), windowEnd: sendDate };
  }

  const sendDate = fifteenthOfNextMonth(madeOn);
  return { sendDate, windowStart: lastDayOfMonth(madeOn), windowEnd: sendDate };
}

/**
 * The earliest an event may start to be credited to this donation.
 *
 * **Currently unused in production.** Session eligibility moved to the rolling
 * `[created_at + 7d, +30d]` window in `services/donations/allocation.service.js`, whose
 * 7-day floor subsumes the 2-day rule below. Kept because that decision is not settled —
 * if eligibility ever returns to the fixed calendar, this is the floor it needs.
 *
 * Do not read the tests covering this function as proof that the no-event-predates-the-gift
 * invariant is enforced: it is, but by `ELIGIBILITY_MIN_DAYS` in the allocation service, and
 * that is where its test lives.
 *
 * **A safety clause, not a consequence of the calendar arithmetic**, and the distinction is the
 * point. The bucket rule above already keeps events ahead of the gift, but only via an
 * off-by-one that is invisible in the rule itself: a gift on the 14th skips the 15th send and
 * waits for EOM. The obvious tidy-up — "just send at the next boundary" — silently thanks a
 * donor on the 15th for an event that ran on the 13th.
 *
 * Taking the later of the two bounds makes that unrepresentable regardless of what anyone
 * later does to the window maths. It also absorbs the boundary case where a gift on the 15th
 * lands in a window opening the same day.
 *
 * @param {Date|string} donatedAt
 * @param {Edition} [edition] Defaults to the donation's own edition.
 * @returns {Date}
 */
function selectionStart(donatedAt, edition = editionForDonation(donatedAt)) {
  const floor = new Date(startOfDay(new Date(donatedAt)).getTime() + SELECTION_FLOOR_DAYS * DAY_MS);
  return floor > edition.windowStart ? floor : edition.windowStart;
}

/**
 * Fixed rather than derived from `toLocaleDateString`, which returns "Sept" for September
 * under newer ICU and "Sep" under older — a label that changes with the Node build is not
 * something to debug on demo day.
 */
const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Human label for an edition, e.g. `"15 Aug – 30 Aug"`, naming the range it covers rather
 * than the day it sends. The server sends no display strings over the API (CONTEXT.md §29) —
 * this is for email subject lines and seed data only.
 *
 * @param {Edition} edition
 * @returns {string}
 */
function editionLabel(edition) {
  const format = (date) =>
    `${date.getUTCDate()} ${MONTH_ABBREVIATIONS[date.getUTCMonth()]}`;
  const lastCoveredDay = new Date(edition.windowEnd.getTime() - DAY_MS);
  return `${format(edition.windowStart)} – ${format(lastCoveredDay)}`;
}

module.exports = {
  SELECTION_FLOOR_DAYS,
  MONTH_ABBREVIATIONS,
  lastDayOfMonth,
  editionForDonation,
  selectionStart,
  editionLabel,
};
