const opportunitiesRepo = require("../../data/volunteer-opportunities.repo");
const { parsePaging, buildMeta } = require("../../lib/pagination");
const { ApiError } = require("../../lib/api-error");

/**
 * Public listing shape — bilingual fields intact for client locale switching.
 *
 * @param {object} row
 * @param {number} interestedCount
 * @param {number} localSignupsCount
 */
function toPublic(row, interestedCount = 0, localSignupsCount = 0) {
  const handsonFilled = Number(row.spots_filled) || 0;
  const localFilled = Number(localSignupsCount) || 0;
  const effectiveFilled = handsonFilled + localFilled;
  const capacity = Number(row.capacity) || 0;
  const status =
    effectiveFilled >= capacity && capacity > 0 ? "full" : row.status;

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
    capacity,
    spots_filled: effectiveFilled,
    spots_filled_handson: handsonFilled,
    local_signups_count: localFilled,
    interested_count: interestedCount,
    seats_left: Math.max(0, capacity - effectiveFilled),
    min_age: row.min_age,
    skills: row.skills ?? [],
    status,
    source: row.source,
    handson_url: row.handson_url,
    handson_opportunity_id: row.handson_opportunity_id,
    last_synced_at: row.last_synced_at,
  };
}

/**
 * @param {object[]} rows
 */
async function withCounts(rows) {
  const ids = rows.map((row) => row.id);
  const interestCounts = await opportunitiesRepo.countInterestsByOpportunity(ids);
  const localCounts = await opportunitiesRepo.countLocalSignupsByOpportunity(ids);

  return rows.map((row) =>
    toPublic(
      row,
      interestCounts.get(row.id) || 0,
      localCounts.get(row.id) || 0,
    ),
  );
}

/**
 * @param {object} query
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
    items: await withCounts(rows),
    meta: buildMeta(total, paging),
  };
}

/**
 * @param {string} id
 */
async function getOpportunityById(id) {
  const row = await opportunitiesRepo.findOpenById(id);

  if (!row) {
    throw ApiError.notFound("Opportunity not found");
  }

  const [item] = await withCounts([row]);
  return item;
}

/**
 * @param {string} opportunityId
 */
async function assertSeatAvailable(opportunityId) {
  const row = await opportunitiesRepo.findOpenById(opportunityId);

  if (!row) {
    throw ApiError.notFound("Opportunity not found");
  }

  const localCounts = await opportunitiesRepo.countLocalSignupsByOpportunity([opportunityId]);
  const localFilled = localCounts.get(opportunityId) || 0;
  const effectiveFilled = Number(row.spots_filled) + localFilled;

  if (effectiveFilled >= Number(row.capacity)) {
    throw ApiError.conflict("This opportunity is full");
  }

  return { row, localFilled };
}

/**
 * @param {string} opportunityId
 * @param {number} localFilledAfterSignup
 */
async function syncStatusAfterSignup(opportunityId, localFilledAfterSignup) {
  const row = await opportunitiesRepo.findOpportunityById(opportunityId);
  if (!row) {
    return;
  }

  const effectiveFilled = Number(row.spots_filled) + localFilledAfterSignup;
  if (effectiveFilled >= Number(row.capacity) && row.status !== "full") {
    await opportunitiesRepo.updateOpportunity(opportunityId, { status: "full" });
  }
}

/**
 * @param {string} opportunityId
 */
async function syncStatusAfterCancel(opportunityId) {
  const row = await opportunitiesRepo.findOpportunityById(opportunityId);
  if (!row || row.status !== "full") {
    return;
  }

  const localCounts = await opportunitiesRepo.countLocalSignupsByOpportunity([opportunityId]);
  const localFilled = localCounts.get(opportunityId) || 0;
  const effectiveFilled = Number(row.spots_filled) + localFilled;

  if (effectiveFilled < Number(row.capacity)) {
    await opportunitiesRepo.updateOpportunity(opportunityId, { status: "open" });
  }
}

module.exports = {
  listOpportunities,
  getOpportunityById,
  toPublic,
  assertSeatAvailable,
  syncStatusAfterSignup,
  syncStatusAfterCancel,
};
