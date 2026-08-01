/**
 * Retention sketch for Admin Studio — live DB counts only (§23).
 * We do not collect visitor→page funnels or UTMs; stages are form-side
 * interest / signup / gift totals. Empty windows stay at zero.
 */

const donationsRepo = require("../../data/donations.repo");
const signupsRepo = require("../../data/signups.repo");
const interestsRepo = require("../../data/interests.repo");

/** @type {Record<string, string>} */
const SOURCE_LABELS = {
  direct: "Direct / bookmark",
  instagram: "Instagram",
  handson: "HandsOn HK",
  search: "Search",
  referral: "Referral / partner",
  website: "Website",
  friend: "Friend / family",
  other: "Other / unknown",
  unknown: "Other / unknown",
};

/**
 * @param {number} from
 * @param {number} to
 */
function rate(from, to) {
  if (!from) return 0;
  return Math.round((to / from) * 1000) / 10;
}

/**
 * @param {Array<{ source: string, count: number }>} rows
 * @returns {Map<string, number>}
 */
function toCountMap(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = row.source || "unknown";
    map.set(key, (map.get(key) ?? 0) + (Number(row.count) || 0));
  }
  return map;
}

/**
 * @returns {Promise<{
 *   stages: Array<{ id: string, label: string, count: number, conversion_from_prev: number | null }>,
 *   dropoffs: Array<{ from: string, to: string, from_label: string, to_label: string, lost: number, rate: number }>,
 *   sources: Array<{ source: string, label: string, visitors: number, volunteers: number, donors: number }>,
 *   seeded: boolean,
 *   empty: boolean,
 *   period_label: string,
 *   note: string,
 * }>}
 */
async function getFunnel() {
  let liveInterests = 0;
  let liveSignups = 0;
  let liveDonors = 0;
  /** @type {Array<{ source: string, count: number }>} */
  let donorSources = [];
  /** @type {Array<{ source: string, count: number }>} */
  let volunteerSources = [];

  try {
    liveInterests = await interestsRepo.countAll();
  } catch {
    liveInterests = 0;
  }

  try {
    liveSignups = await signupsRepo.countAll();
  } catch {
    liveSignups = 0;
  }

  try {
    const money = await donationsRepo.sumAmounts();
    liveDonors = money.count;
  } catch {
    liveDonors = 0;
  }

  try {
    donorSources = await donationsRepo.countByReferralSource();
  } catch {
    donorSources = [];
  }

  try {
    volunteerSources = await signupsRepo.countByDiscoverySource();
  } catch {
    volunteerSources = [];
  }

  const stages = [
    {
      id: "volunteer_intent",
      label: "Volunteer interests",
      count: liveInterests,
    },
    {
      id: "volunteer",
      label: "Session signups",
      count: liveSignups,
    },
    {
      id: "donor",
      label: "Donors (gifts)",
      count: liveDonors,
    },
  ];

  const withRates = stages.map((stage, i) => ({
    ...stage,
    conversion_from_prev: i === 0 ? null : rate(stages[i - 1].count, stage.count),
  }));

  const dropoffs = [];
  for (let i = 0; i < stages.length - 1; i += 1) {
    const from = stages[i];
    const to = stages[i + 1];
    const lost = Math.max(0, from.count - to.count);
    dropoffs.push({
      from: from.id,
      to: to.id,
      from_label: from.label,
      to_label: to.label,
      lost,
      rate: rate(from.count, lost),
    });
  }

  const donorMap = toCountMap(donorSources);
  const volunteerMap = toCountMap(volunteerSources);
  const keys = new Set([...donorMap.keys(), ...volunteerMap.keys()]);
  const sources = [...keys]
    .map((source) => ({
      source,
      label: SOURCE_LABELS[source] || SOURCE_LABELS.other,
      visitors: 0,
      volunteers: volunteerMap.get(source) ?? 0,
      donors: donorMap.get(source) ?? 0,
    }))
    .filter((row) => row.volunteers > 0 || row.donors > 0)
    .sort((a, b) => b.volunteers + b.donors - (a.volunteers + a.donors));

  const empty =
    liveInterests === 0 && liveSignups === 0 && liveDonors === 0 && sources.length === 0;

  return {
    stages: withRates,
    dropoffs,
    sources,
    seeded: false,
    empty,
    period_label: "All time (site records)",
    note: empty
      ? "No interests, signups, or gifts yet — figures stay at zero until people use the forms."
      : "Live counts from interests, session signups, and gifts. We do not collect anonymous visitor funnels or UTMs (§23).",
  };
}

module.exports = { getFunnel, rate };
