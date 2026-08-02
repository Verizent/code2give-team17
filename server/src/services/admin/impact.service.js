const impactRepo = require("../../data/impact.repo");
const { ApiError } = require("../../lib/api-error");
const { parsePaging, buildMeta } = require("../../lib/pagination");

async function listAdminImpact(query = {}) {
  const paging = parsePaging(query);
  const { rows, total } = await impactRepo.listAll({ from: paging.from, to: paging.to });
  return { items: rows, meta: buildMeta(total, paging) };
}

async function getAdminImpact(id) {
  const row = await impactRepo.findById(id);
  if (!row) throw ApiError.notFound(`No impact period with id "${id}"`);
  return row;
}

async function createAdminImpact(body) {
  return impactRepo.create(body);
}

async function updateAdminImpact(id, body) {
  const row = await impactRepo.update(id, body);
  if (!row) throw ApiError.notFound(`No impact period with id "${id}"`);
  return row;
}

async function deleteAdminImpact(id) {
  const row = await impactRepo.findById(id);
  if (!row) throw ApiError.notFound(`No impact period with id "${id}"`);
  if (row.is_current) {
    throw ApiError.conflict("Cannot delete the current impact period — unset is_current first");
  }
  await impactRepo.remove(id);
}

module.exports = {
  listAdminImpact, getAdminImpact, createAdminImpact, updateAdminImpact, deleteAdminImpact,
};
