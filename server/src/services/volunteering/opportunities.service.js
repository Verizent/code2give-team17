const opportunitiesRepo = require("../../data/opportunities.repo");
const interestsRepo = require("../../data/interests.repo");
const { ApiError } = require("../../lib/api-error");
const { parsePaging, buildMeta } = require("../../lib/pagination");

/**
 * Public listing shape. Bilingual `_en` / `_zh` pairs are left intact so the
 * client can switch locale without refetching. `interested_count` is always
 * present (CONTEXT §29) and is never summed into capacity math.
 *
 * @param {object} row
 * @param {number} [interestedCount]
 */
function toPublic(row, interestedCount = 0) {
  return {
    id: row.id,
    title_en: row.title_en,
    title_zh: row.title_zh,
    description_en: row.description_en,
    description_zh: row.description_zh,
    location_en: row.location_en,
    location_zh: row.location_zh,
    programme: row.programme,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    capacity: row.capacity,
    spots_filled: row.spots_filled,
    interested_count: interestedCount,
    min_age: row.min_age,
    skills: row.skills ?? [],
    status: row.status,
    source: row.source,
    handson_url: row.handson_url,
    handson_opportunity_id: row.handson_opportunity_id,
    last_synced_at: row.last_synced_at,
  };
}

/**
 * @param {object[]} rows
 * @returns {Promise<object[]>}
 */
async function withInterestCounts(rows) {
  const counts = await interestsRepo.countByOpportunityIds(rows.map((r) => r.id));
  return rows.map((row) => toPublic(row, counts.get(row.id) ?? 0));
}

/**
 * `GET /api/opportunities`
 *
 * @param {{ page?: number, limit?: number, programme?: string, source?: string }} query
 */
async function listOpportunities(query = {}) {
  const paging = parsePaging(query);

  const { rows, total } = await opportunitiesRepo.listOpen({
    from: paging.from,
    to: paging.to,
    programme: query.programme,
    source: query.source,
  });

  return {
    items: await withInterestCounts(rows),
    meta: buildMeta(total, paging),
  };
}

/**
 * `GET /api/opportunities/:id`
 *
 * @param {string} id
 */
async function getOpportunityById(id) {
  const row = await opportunitiesRepo.findOpenById(id);

  if (!row) {
    throw ApiError.notFound(`No open opportunity with id "${id}"`);
  }

  const [item] = await withInterestCounts([row]);
  return item;
}

module.exports = { listOpportunities, getOpportunityById, toPublic };
