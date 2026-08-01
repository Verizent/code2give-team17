const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MIN_LIMIT = 1;
const MAX_LIMIT = 50;

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * @param {{ page?: unknown, limit?: unknown }} query
 * @returns {{ page: number, limit: number, from: number, to: number }}
 */
function parsePaging(query = {}) {
  const page = Math.max(DEFAULT_PAGE, toInt(query.page, DEFAULT_PAGE));
  const limit = Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, toInt(query.limit, DEFAULT_LIMIT)));
  const from = (page - 1) * limit;

  return { page, limit, from, to: from + limit - 1 };
}

/**
 * @param {number} total
 * @param {{ page: number, limit: number }} paging
 */
function buildMeta(total, paging) {
  return { total, page: paging.page, limit: paging.limit };
}

module.exports = { parsePaging, buildMeta };
