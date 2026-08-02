// DEMO-ONLY: the Analytics block on /admin reads these invented figures instead of
// /api/admin/analytics when VITE_ANALYTICS_STUB=true — real version needs the live
// endpoint (§19, §26).
//
// Scope is deliberately narrow. Everything else on /admin — the Today queue, the Live
// figures tiles, articles, wishlist, Instagram, moderation and fundraisers — talks to the
// real API. Only this one section is fabricated, and the page already labels it
// "illustrative figures" in the UI.
//
// Why stub it at all: the seeded giving history is a handful of gifts across three
// months, which reads as an empty chart on a projector. The volunteer figures the live
// endpoint returns are real, so substituting them here is the honest cost of this seam —
// see the §19 checklist entry.
//
// Numbers are derived rather than typed so they cannot contradict each other on screen:
// programme rows sum to the capacity tile, and acquisition sources sum to the donor count.

import type { AnalyticsPayload } from './api'

export const ANALYTICS_STUB = import.meta.env.VITE_ANALYTICS_STUB === 'true'

/** Percentage to one decimal; null when the denominator is empty, per the API contract. */
function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return Math.round((numerator / denominator) * 1000) / 10
}

function scale(value: number, factor: number): number {
  return Math.max(1, Math.round(value * factor))
}

/**
 * Giving history, 24 months to 2026-08. Year-end and Lunar New Year peaks are what a
 * Hong Kong charity's giving actually looks like; a flat line reads as invented.
 * Only the last 12 are ever shown — the rest exist so the shorter ranges can slice.
 */
const DONATIONS_BY_MONTH = [
  { month: '2024-09', amount_hkd: 8400 },
  { month: '2024-10', amount_hkd: 9150 },
  { month: '2024-11', amount_hkd: 11200 },
  { month: '2024-12', amount_hkd: 24600 },
  { month: '2025-01', amount_hkd: 10800 },
  { month: '2025-02', amount_hkd: 16400 },
  { month: '2025-03', amount_hkd: 12900 },
  { month: '2025-04', amount_hkd: 11750 },
  { month: '2025-05', amount_hkd: 13300 },
  { month: '2025-06', amount_hkd: 15050 },
  { month: '2025-07', amount_hkd: 12400 },
  { month: '2025-08', amount_hkd: 14900 },
  { month: '2025-09', amount_hkd: 16250 },
  { month: '2025-10', amount_hkd: 17800 },
  { month: '2025-11', amount_hkd: 19400 },
  { month: '2025-12', amount_hkd: 38900 },
  { month: '2026-01', amount_hkd: 18600 },
  { month: '2026-02', amount_hkd: 27300 },
  { month: '2026-03', amount_hkd: 21450 },
  { month: '2026-04', amount_hkd: 20100 },
  { month: '2026-05', amount_hkd: 22800 },
  { month: '2026-06', amount_hkd: 25600 },
  { month: '2026-07', amount_hkd: 21900 },
  { month: '2026-08', amount_hkd: 12300 },
]

/** Capacity and attendance per programme over the full window. */
const PROGRAMMES = [
  { programme: 'sports', capacity: 320, signups: 296, attended: 241 },
  { programme: 'nutrition', capacity: 180, signups: 168, attended: 139 },
  { programme: 'fitness', capacity: 160, signups: 141, attended: 118 },
  { programme: 'community_education', capacity: 120, signups: 96, attended: 74 },
  { programme: 'family_support', capacity: 60, signups: 52, attended: 40 },
]

const DONOR_SOURCES = [
  { source: 'instagram', count: 58 },
  { source: 'friend', count: 41 },
  { source: 'search', count: 33 },
  { source: 'event', count: 22 },
  { source: 'employer', count: 18 },
  { source: 'unknown', count: 12 },
]

const VOLUNTEER_SOURCES = [
  { source: 'friend', count: 46 },
  { source: 'instagram', count: 34 },
  { source: 'school', count: 28 },
  { source: 'handson', count: 21 },
  { source: 'employer', count: 14 },
  { source: 'unknown', count: 9 },
]

type RangeKey = 'all' | '1y' | '6m' | '3m' | '1m'

const RANGE_PROFILE: Record<
  RangeKey,
  { months: number; factor: number; prior: string; current: string }
> = {
  // 12 rather than 24: the chart is captioned "past twelve months" and the live
  // endpoint caps its series there too.
  all: { months: 12, factor: 1, prior: 'Sep 24–Aug 25', current: 'Sep 25–Aug 26' },
  '1y': { months: 12, factor: 0.55, prior: 'Aug 24–Feb 25', current: 'Feb 25–Aug 26' },
  '6m': { months: 6, factor: 0.29, prior: 'Nov 25–Feb 26', current: 'Mar 26–Aug 26' },
  '3m': { months: 3, factor: 0.15, prior: 'Feb 26–Apr 26', current: 'May 26–Aug 26' },
  '1m': { months: 1, factor: 0.05, prior: 'Jun 26–Jul 26', current: 'Jul 26–Aug 26' },
}

export function analyticsFixture(range: string): AnalyticsPayload {
  const key: RangeKey = (Object.keys(RANGE_PROFILE) as RangeKey[]).includes(range as RangeKey)
    ? (range as RangeKey)
    : 'all'
  const profile = RANGE_PROFILE[key]

  const programmes = PROGRAMMES.map((row) => {
    const capacity = scale(row.capacity, profile.factor)
    const attended = scale(row.attended, profile.factor)
    return {
      programme: row.programme,
      capacity,
      signups: scale(row.signups, profile.factor),
      attended,
      fill_rate: rate(attended, capacity),
    }
  })

  // Derived from the rows above so the headline tile can never disagree with the bars.
  const capacity = programmes.reduce((sum, row) => sum + row.capacity, 0)
  const attended = programmes.reduce((sum, row) => sum + row.attended, 0)

  const donors = DONOR_SOURCES.map((row) => ({
    source: row.source,
    count: scale(row.count, profile.factor),
  }))
  const volunteers = VOLUNTEER_SOURCES.map((row) => ({
    source: row.source,
    count: scale(row.count, profile.factor),
  }))

  const currentDonors = donors.reduce((sum, row) => sum + row.count, 0)
  const priorDonors = Math.round(currentDonors * 0.87)
  const retained = Math.round(priorDonors * 0.444)
  const repeatDonors = Math.round(currentDonors * 0.337)

  return {
    range: key,
    donor_retention: {
      rate: rate(retained, priorDonors),
      retained,
      prior_donors: priorDonors,
      current_donors: currentDonors,
      prior_window_label: profile.prior,
      current_window_label: profile.current,
      // The 40–45% sector benchmark is annual — printing it against a 1-month
      // window would invite a comparison that is not valid.
      benchmark_applies: key === 'all' || key === '1y',
    },
    repeat_gift: {
      rate: rate(repeatDonors, currentDonors),
      repeat_donors: repeatDonors,
      total_donors: currentDonors,
    },
    capacity_fill: { rate: rate(attended, capacity), attended, capacity },
    satisfaction: {
      average_rating: 4.6,
      would_return_rate: 92.4,
      responses: scale(148, profile.factor),
    },
    donations_by_month: DONATIONS_BY_MONTH.slice(-profile.months),
    programmes,
    acquisition: { donors, volunteers, available: true },
  }
}
