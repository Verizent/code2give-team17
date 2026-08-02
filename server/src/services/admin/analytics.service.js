const analyticsRepo = require("../../data/analytics.repo");

const MONTHS_PER_WINDOW = 12;
const SUCCEEDED = "succeeded";
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
function donorRetention(donations, now = new Date()) {
  const currentStart = shiftMonths(now, -MONTHS_PER_WINDOW);
  const priorStart = shiftMonths(now, -MONTHS_PER_WINDOW * 2);

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
 * Attendance against places offered, across every session.
 *
 * @param {object[]} sessions
 */
function capacityFill(sessions) {
  let capacity = 0;
  let attended = 0;

  for (const row of sessions) {
    capacity += Number(row.capacity) || 0;
    attended += Number(row.attendance_count) || 0;
  }

  // A session roster that exists but has never been marked reads as attended === 0.
  // That is absence of evidence, so it must not become a 0% finding.
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
 * Places offered against people who came, per programme, busiest first.
 *
 * @param {object[]} sessions
 */
function popularProgrammes(sessions) {
  const byProgramme = new Map();

  for (const row of sessions) {
    if (!row.programme) continue;

    const entry = byProgramme.get(row.programme) ?? { capacity: 0, attendance_count: 0 };
    entry.capacity += Number(row.capacity) || 0;
    entry.attendance_count += Number(row.attendance_count) || 0;
    byProgramme.set(row.programme, entry);
  }

  return [...byProgramme]
    .map(([programme, entry]) => ({
      programme,
      capacity: entry.capacity,
      attendance_count: entry.attendance_count,
      fill_rate: entry.attendance_count > 0 ? rate(entry.attendance_count, entry.capacity) : null,
    }))
    .sort((a, b) => b.attendance_count - a.attendance_count || b.capacity - a.capacity);
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
async function getAnalytics(now = new Date()) {
  const [donations, sessions, signups, sources] = await Promise.all([
    analyticsRepo.listDonations(),
    analyticsRepo.listSessions(),
    analyticsRepo.listSignupFeedback(),
    analyticsRepo.listAcquisitionSources(),
  ]);

  return {
    donor_retention: donorRetention(donations, now),
    repeat_gift: repeatGiftRate(donations),
    capacity_fill: capacityFill(sessions),
    satisfaction: satisfaction(signups),
    programmes: popularProgrammes(sessions),
    acquisition: {
      ...acquisitionSource(sources),
      available: sources.available !== false,
    },
  };
}

module.exports = {
  getAnalytics,
  rate,
  donorRetention,
  repeatGiftRate,
  capacityFill,
  satisfaction,
  popularProgrammes,
  acquisitionSource,
};
