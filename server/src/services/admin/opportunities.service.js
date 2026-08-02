const opportunitiesRepo = require("../../data/volunteer-opportunities.repo");
const { parsePaging, buildMeta } = require("../../lib/pagination");
const { ApiError } = require("../../lib/api-error");

/**
 * Admin variant of opportunities service — returns **raw `_en`/`_zh`** rows because
 * the admin UI edits both languages side-by-side. Public reads use `services/volunteering/
 * opportunities.service.js`, which collapses via `resolveLocale`.
 *
 * @param {object} body Validated `createOpportunityBodySchema` output.
 */
async function createOpportunity(body) {
  return opportunitiesRepo.createOpportunity(body);
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

  return { items: rows, meta: buildMeta(total, paging) };
}

module.exports = {
  createOpportunity,
  updateOpportunity,
  removeOpportunity,
  listForAdmin,
};
