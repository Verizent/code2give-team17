const analyticsRepo = require("../../data/analytics.repo");
// Cross-service import on purpose: the dashboard already owns UTC month bucketing and
// its edge cases are unit-tested there. A second implementation here would be a second
// thing to get wrong at a year boundary.
const { lastNMonths, fillMonthSeries } = require("./dashboard.service");

const MONTHS_PER_WINDOW = 12;
/** The giving chart spans a full year. */
const CHART_MONTHS = 12;
const SUCCEEDED = "succeeded";

/** Window lengths in months. `all` is unbounded. */
const RANGE_MONTHS = { all: null, "1y": 12, "6m": 6, "3m": 3, "1m": 1 };
/** A one-bar chart is not a chart, so short ranges still draw three months. */
const MIN_CHART_MONTHS = 3;
const UNKNOWN_SOURCE = "unknown";

/**
 * A percentage, or `null` when the question cannot be answered.
 *
 * `null` rather than `0` is the whole point. Every metric on this page is a ratio, and
 * an empty denominator is the normal state of a young charity dataset. Rendering `0%`
 * for "no sessions have recorded attendance" claims that nobody turned up — a false
 * statement about the organisation, not a rounding artefact. `null` lets the client say
 * "not enough data yet" instead.
 *
 * @param {number} numerator
 * @param {number} denominator
 * @returns {number | null} 0–100, to one decimal place
 */
function rate(numerator, denominator) {
  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  if (!Number.isFinite(numerator)) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/**
 * Start of the selected window, or null for all-time.
 *
 * Inclusive at the boundary: a gift made at the exact cutoff instant belongs to the
 * window. Excluding it would drop a real row for no reason a reader could infer.
 *
 * @param {string} range
 * @param {Date} [now]
 * @returns {Date | null}
 */
function windowFor(range, now = new Date()) {
  const months = RANGE_MONTHS[range] ?? null;
  return months === null ? null : shiftMonths(now, -months);
}

/**
 * @param {object[]} rows
 * @param {string} field
 * @param {Date | null} start
 */
function within(rows, field, start) {
  if (!start) return rows;

  return rows.filter((row) => {
    const at = new Date(row[field]);
    return !Number.isNaN(at.getTime()) && at >= start;
  });
}

/**
 * Short human label for a window, e.g. "Aug 24–Aug 25".
 *
 * Both years are always shown. A 12-month window starts and ends in the same month, so
 * omitting the years rendered as "Aug–Aug 25", which reads as a typo rather than a year.
 */
function windowLabel(from, to) {
  const stamp = (d) =>
    `${d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })} ${String(
      d.getUTCFullYear(),
    ).slice(2)}`;
  return `${stamp(from)}–${stamp(to)}`;
}

/**
 * @param {Date} from
 * @param {number} months
 */
function shiftMonths(from, months) {
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/** @param {object[]} rows */
function succeededOnly(rows) {
  return rows.filter((row) => row.status === SUCCEEDED);
}

/**
 * Share of last year's donors who gave again this year.
 *
 * The denominator is the PRIOR window, not everyone who has ever given: a supporter who
 * first gave last month has had no opportunity to lapse, and counting them would drag
 * the rate down and make a healthy year look like attrition.
 *
 * @param {object[]} donations
 * @param {Date} [now]
 */
function donorRetention(donations, now = new Date(), months = MONTHS_PER_WINDOW) {
  const currentStart = shiftMonths(now, -months);
  const priorStart = shiftMonths(now, -months * 2);

  const current = new Set();
  const prior = new Set();

  for (const row of succeededOnly(donations)) {
    const at = new Date(row.created_at);
    if (Number.isNaN(at.getTime())) continue;

    if (at >= currentStart && at <= now) current.add(row.donor_id);
    else if (at >= priorStart && at < currentStart) prior.add(row.donor_id);
  }

  const retained = [...prior].filter((donorId) => current.has(donorId)).length;

  return {
    rate: rate(retained, prior.size),
    retained,
    prior_donors: prior.size,
    current_donors: current.size,
    // The tile renders "N of M donors who gave <prior> gave again <current>". Naming both
    // windows is what keeps the figure interpretable once the range stops being a year —
    // without them a 3-month number looks exactly like an annual one.
    prior_window_label: windowLabel(priorStart, currentStart),
    current_window_label: windowLabel(currentStart, now),
    // The published 40–45% benchmark is defined annually. Printed beside a 3-month figure
    // it invites a comparison that is not valid, so the client withholds it.
    benchmark_applies: months === MONTHS_PER_WINDOW,
  };
}

/**
 * Share of donors who have given more than once.
 *
 * @param {object[]} donations
 */
function repeatGiftRate(donations) {
  const giftsPerDonor = new Map();

  for (const row of succeededOnly(donations)) {
    giftsPerDonor.set(row.donor_id, (giftsPerDonor.get(row.donor_id) ?? 0) + 1);
  }

  const repeatDonors = [...giftsPerDonor.values()].filter((count) => count >= 2).length;

  return {
    rate: rate(repeatDonors, giftsPerDonor.size),
    repeat_donors: repeatDonors,
    total_donors: giftsPerDonor.size,
  };
}

/**
 * Volunteer attendance against the places offered on volunteer opportunities.
 *
 * Volunteers, not members: this used to read `sessions`, whose programme list includes
 * `where_needed` — a donation designation nobody can volunteer for.
 *
 * @param {object[]} opportunities
 * @param {object[]} signups
 */
function capacityFill(opportunities, signups) {
  const capacity = opportunities.reduce((sum, row) => sum + (Number(row.capacity) || 0), 0);
  const attended = signups.filter((row) => row.attended_at).length;

  // Signups that exist but were never marked attended read as attended === 0. That is
  // absence of evidence, so it must not become a 0% finding.
  return {
    rate: attended > 0 ? rate(attended, capacity) : null,
    attended,
    capacity,
  };
}

/**
 * Volunteer experience, over the volunteers who actually answered.
 *
 * Gated on `feedback_submitted_at` rather than on the rating being non-null, because a
 * blank rating on a submitted form is a real datapoint about response quality, whereas a
 * row that was never submitted is not a response at all.
 *
 * @param {object[]} signups
 */
function satisfaction(signups) {
  const responses = signups.filter((row) => row.feedback_submitted_at);
  const ratings = responses
    .map((row) => Number(row.experience_rating))
    .filter((value) => Number.isFinite(value));

  const wouldReturn = responses.filter((row) => row.would_return === true).length;
  const total = ratings.reduce((sum, value) => sum + value, 0);

  return {
    average_rating: ratings.length ? Math.round((total / ratings.length) * 10) / 10 : null,
    would_return_rate: rate(wouldReturn, responses.length),
    responses: responses.length,
  };
}

/**
 * Places offered, signed up and turned up, per volunteer programme, busiest first.
 *
 * Three numbers rather than two: the gap between signed up and attended is the no-show
 * rate, the most actionable figure a volunteer manager has, and rendering it as a bar
 * saves it needing a tile and an explanation of its own.
 *
 * @param {object[]} opportunities
 * @param {object[]} signups
 */
function popularProgrammes(opportunities, signups) {
  const byProgramme = new Map();
  const programmeOf = new Map();

  for (const row of opportunities) {
    if (!row.programme) continue;

    programmeOf.set(row.id, row.programme);
    const entry = byProgramme.get(row.programme) ?? { capacity: 0, signups: 0, attended: 0 };
    entry.capacity += Number(row.capacity) || 0;
    byProgramme.set(row.programme, entry);
  }

  for (const row of signups) {
    const programme = programmeOf.get(row.opportunity_id);
    // A signup whose opportunity fell outside the window has no bar to join.
    if (!programme) continue;

    const entry = byProgramme.get(programme);
    entry.signups += 1;
    if (row.attended_at) entry.attended += 1;
  }

  return [...byProgramme]
    .map(([programme, entry]) => ({
      programme,
      capacity: entry.capacity,
      signups: entry.signups,
      attended: entry.attended,
      fill_rate: entry.attended > 0 ? rate(entry.attended, entry.capacity) : null,
    }))
    .sort((a, b) => b.attended - a.attended || b.capacity - a.capacity);
}

/**
 * Settled donation totals for the last twelve calendar months, oldest first.
 *
 * Months with no gifts are zero-filled rather than omitted, so the chart shows a quiet
 * month as a short bar instead of silently compressing the axis.
 *
 * @param {object[]} donations
 * @param {Date} [now]
 */
function donationsByMonth(donations, now = new Date(), months = CHART_MONTHS) {
  const totals = new Map();

  for (const row of succeededOnly(donations)) {
    const at = new Date(row.created_at);
    if (Number.isNaN(at.getTime())) continue;

    const month = at.toISOString().slice(0, 7);
    totals.set(month, (totals.get(month) ?? 0) + (Number(row.amount_hkd) || 0));
  }

  const live = [...totals].map(([month, amount_hkd]) => ({ month, amount_hkd }));

  return fillMonthSeries(live, lastNMonths(months, now), (row, month) => ({
    month,
    amount_hkd: row?.amount_hkd ?? 0,
  }));
}

/** @param {object[]} rows */
function countBySource(rows) {
  const counts = new Map();

  for (const row of rows) {
    const key = row.source || UNKNOWN_SOURCE;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * @param {{ donors: object[], volunteers: object[] }} rows
 */
function acquisitionSource({ donors = [], volunteers = [] }) {
  return {
    donors: countBySource(donors),
    volunteers: countBySource(volunteers),
  };
}

/**
 * Marketing analytics for the admin Analytics tab (§23).
 *
 * Aggregated here rather than in SQL because PostgREST cannot express `group by` without
 * a database function, and every table involved is small. Revisit as an RPC if donations
 * or signups outgrow a single PostgREST page.
 *
 * @returns {Promise<object>}
 */
async function getAnalytics(range = "all", now = new Date()) {
  const [donations, opportunities, signups, feedback, sources] = await Promise.all([
    analyticsRepo.listDonations(),
    analyticsRepo.listOpportunities(),
    analyticsRepo.listSignups(),
    analyticsRepo.listSignupFeedback(),
    analyticsRepo.listAcquisitionSources(),
  ]);

  const start = windowFor(range, now);
  const months = RANGE_MONTHS[range] ?? CHART_MONTHS;

  const windowedDonations = within(donations, "created_at", start);
  const windowedOpportunities = within(opportunities, "starts_at", start);
  const windowedSignups = within(signups, "created_at", start);
  const windowedFeedback = within(feedback, "feedback_submitted_at", start);

  return {
    range,
    // Retention re-bases BOTH of its windows to the selected length and reports which two
    // periods it compared, so the number stays interpretable at any range. It reads the
    // unwindowed donations on purpose — it needs the prior period, which by definition
    // sits outside the selected window.
    donor_retention: donorRetention(donations, now, months),
    repeat_gift: repeatGiftRate(windowedDonations),
    capacity_fill: capacityFill(windowedOpportunities, windowedSignups),
    satisfaction: satisfaction(windowedFeedback),
    donations_by_month: donationsByMonth(
      windowedDonations,
      now,
      Math.max(MIN_CHART_MONTHS, Math.min(months, CHART_MONTHS)),
    ),
    programmes: popularProgrammes(windowedOpportunities, windowedSignups),
    acquisition: {
      ...acquisitionSource(sources),
      available: sources.available !== false,
    },
  };
}

module.exports = {
  getAnalytics,
  windowFor,
  rate,
  donorRetention,
  repeatGiftRate,
  capacityFill,
  satisfaction,
  donationsByMonth,
  popularProgrammes,
  acquisitionSource,
};
