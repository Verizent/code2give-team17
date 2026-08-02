const opportunitiesRepo = require("../../data/volunteer-opportunities.repo");
// Module object, not destructured, so `mock.method` stubs are honoured in tests.
const sessionsRepo = require("../../data/sessions.repo");
const { parsePaging, buildMeta } = require("../../lib/pagination");
const { ApiError } = require("../../lib/api-error");

/**
 * `volunteer_opportunities.programme` -> `sessions.programme`. The two tables were designed
 * by different tracks and never agreed a vocabulary: sessions has `family` and `community`
 * where opportunities has `family_support` and `community_education` (20260803_1110 records
 * why they were not merged). Live `sessions.programme` carries no check constraint, so an
 * unmapped value would insert happily and then be invisible to every programme filter —
 * hence an explicit map rather than passing the string through.
 */
const SESSION_PROGRAMME = {
  sports: "sports",
  fitness: "fitness",
  nutrition: "nutrition",
  family_support: "family",
  community_education: "community",
};

/**
 * Admin variant of opportunities service — returns **raw `_en`/`_zh`** rows because
 * the admin UI edits both languages side-by-side. Public reads use `services/volunteering/
 * opportunities.service.js`, which collapses via `resolveLocale`.
 *
 * @param {object} body Validated `createOpportunityBodySchema` output.
 */
async function createOpportunity(body) {
  const opportunity = await opportunitiesRepo.createOpportunity(body);

  // The listing and the session are the same real-world event, so the session row is part
  // of creating the listing rather than a follow-up an admin has to remember. Nothing wrote
  // `sessions.volunteer_opportunity_id` before this: 20260803_1110 added the column as the
  // enabling step and left the write to whoever needed it first.
  let session;
  try {
    session = await sessionsRepo.create(sessionRowFor(opportunity));
  } catch (error) {
    // No cross-table transaction exists through the REST client, and the foreign key forces
    // the opportunity to be written first. A listing with no session is exactly the
    // disconnected state this feature removes, so undo it rather than keep half of it. Safe
    // to delete: the row is seconds old and cannot have signups yet.
    await opportunitiesRepo.deleteOpportunity(opportunity.id).catch(() => {});
    throw error;
  }

  return { opportunity, session };
}

/**
 * @param {object} opportunity A freshly-inserted `volunteer_opportunities` row.
 */
function sessionRowFor(opportunity) {
  return {
    volunteer_opportunity_id: opportunity.id,
    programme: SESSION_PROGRAMME[opportunity.programme],
    title_en: opportunity.title_en,
    title_zh: opportunity.title_zh,
    description_en: opportunity.description_en,
    description_zh: opportunity.description_zh,
    starts_at: opportunity.starts_at,
    ends_at: opportunity.ends_at,
    capacity: opportunity.capacity,
    // Three columns for one value. `sessions` carries both the admin track's `location` and
    // the donations track's `location_en`/`_zh` (20260803_1075 kept both rather than pick a
    // winner the night before the demo). Filling one leaves the other consumer blank.
    location: opportunity.location_en,
    location_en: opportunity.location_en,
    location_zh: opportunity.location_zh,
    status: "scheduled",
  };
}

/**
 * @param {string} id
 * @param {object} patch Validated `updateOpportunityBodySchema` output.
 */
async function updateOpportunity(id, patch) {
  const existing = await opportunitiesRepo.findOpportunityById(id);
  if (!existing) {
    throw ApiError.notFound("Opportunity not found");
  }

  return opportunitiesRepo.updateOpportunity(id, patch);
}

/**
 * @param {string} id
 */
async function removeOpportunity(id) {
  const existing = await opportunitiesRepo.findOpportunityById(id);
  if (!existing) {
    throw ApiError.notFound("Opportunity not found");
  }

  await opportunitiesRepo.deleteOpportunity(id);
}

/**
 * @param {object} query
 */
async function listForAdmin(query = {}) {
  const paging = parsePaging(query);
  const { rows, total } = await opportunitiesRepo.listForAdmin({
    from: paging.from,
    to: paging.to,
    programme: query.programme,
    source: query.source,
    status: query.status,
  });

  // `spots_filled_handson` is HandsOn's booking count and nothing else — the column comment
  // on volunteer_opportunities forbids summing it with our own signups. The roster screen
  // shows "N of capacity", so it needs the local count, which lives in volunteer_signups.
  // One query for the page, not one per row.
  const counts = await opportunitiesRepo.countRosterByOpportunity(rows.map((row) => row.id));

  const items = rows.map((row) => ({
    ...row,
    signup_count: counts.get(row.id) || 0,
  }));

  return { items, meta: buildMeta(total, paging) };
}

module.exports = {
  createOpportunity,
  updateOpportunity,
  removeOpportunity,
  listForAdmin,
};
