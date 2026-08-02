const { z } = require("zod");

const MIN_STORY_LENGTH = 40;

/**
 * A Voices submission from a supporter, parent or volunteer.
 *
 * `consent_given` is a literal `true`, mirroring the `check (consent_given)` constraint
 * on the table — no consent, no row, guaranteed at two layers.
 *
 * `website` is the honeypot and is deliberately ACCEPTED. Rejecting it would tell a bot
 * exactly which field caught it; the service returns the same 201 and writes no row.
 * This reads like a validation bug, so do not "fix" it into a 400.
 */
/**
 * The wall's filter tabs, and the only values a card can be filed under. Kept in step
 * with ACTIVITY_TYPES in client/src/lib/mock.js — a value here with no tab there would
 * be a card that no filter can ever reach.
 */
const ACTIVITY_TYPES = [
  "sport",
  "art",
  "nutrition",
  "family",
  "fitness",
  "special",
  "outings",
  "csr",
];

const createCommunityPostSchema = z.object({
  author_name: z.string().min(1),
  relationship: z.string().min(1),
  // Optional: rows predating the column, and any older client, must keep working.
  activity_type: z.enum(ACTIVITY_TYPES).optional(),
  story: z.string().min(MIN_STORY_LENGTH),
  photo_url: z.string().optional(),
  contact_email: z.email().optional(),
  consent_given: z.literal(true),
  website: z.string().optional(),
});

module.exports = { createCommunityPostSchema, ACTIVITY_TYPES };
