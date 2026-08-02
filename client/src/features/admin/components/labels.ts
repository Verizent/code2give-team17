/** Window options offered by the analytics range control. Mirrors the server enum. */
export const ANALYTICS_RANGES = ['all', '1y', '6m', '3m', '1m'] as const
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number]

/**
 * Programme keys, staff-facing English.
 *
 * Covers both vocabularies on purpose: `sessions` uses `family` / `where_needed` while
 * `volunteer_opportunities` CHECKs for `family_support` / `community_education`. Only the
 * former reaches the analytics panels today, but `sessions.programme` carries no CHECK
 * constraint, so an unmapped value is a question of when — see `label()`.
 */
export const PROGRAMME_LABELS: Record<string, string> = {
  family: 'Family support',
  family_support: 'Family support',
  fitness: 'Fitness',
  nutrition: 'Nutrition',
  sports: 'Sports',
  where_needed: 'Where needed',
  community_education: 'Community education',
}

export const SOURCE_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  friend: 'Friend or family',
  search: 'Search engine',
  school: 'School or university',
  handson: 'HandsOn Hong Kong',
  unknown: 'Not answered',
}

/**
 * Falls back to a readable rendering of the raw key rather than the key itself.
 *
 * Neither `sessions.programme` nor the coming `source` column is constrained to a fixed
 * set, so an unmapped value will turn up. "Youth outreach" is a tolerable label for a
 * chart nobody has updated yet; `youth_outreach` looks like a bug.
 */
export function label(map: Record<string, string>, key: string) {
  if (map[key]) return map[key]
  const words = key.replace(/[_-]+/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : key
}
