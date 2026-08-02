const ACCENTS = ['teal', 'pink', 'yellow', 'navy']

/**
 * Pick a card accent from the row id so a given post keeps the same colour on every
 * render and across reloads. `community_posts` has no accent column and adding one to
 * carry presentation would be the wrong shape for the table.
 */
function accentFor(id) {
  let sum = 0
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i)
  return ACCENTS[sum % ACCENTS.length]
}

/**
 * Map an approved `community_posts` row onto what StoryCard renders.
 *
 * A submitted post carries no title, no activity type and one nullable photo, so it
 * renders as a text-first card rather than being padded out with invented fields.
 * `source` is what StoryCard branches on.
 *
 * `story` stays a plain string and is deliberately NOT locale-switched: it is the
 * submitter's own words in whichever language they wrote, and swapping the site
 * language must not silently relabel someone's testimony as another translation.
 *
 * DEMO-ONLY: `celebrateCount` starts at 0 and the count is local component state —
 * there is no celebrate column or endpoint, so a celebrate is lost on reload. Real
 * version needs a reactions table and a POST.
 *
 * @param {{ id: string, author_name: string, relationship: string, story: string, photo_url: string | null, submitted_at: string }} row
 */
export function mapVoice(row) {
  return {
    id: row.id,
    source: 'community',
    author: row.author_name,
    relationship: row.relationship,
    // Null for rows submitted before the field existed; those stay in "All" only.
    type: row.activity_type ?? null,
    story: row.story,
    images: row.photo_url ? [row.photo_url] : [],
    accent: accentFor(row.id),
    celebrateCount: 0,
    postedAt: row.submitted_at,
  }
}
