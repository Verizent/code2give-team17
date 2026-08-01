const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MIN_LIMIT = 1;
const MAX_LIMIT = 50;

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Normalises `?page=` / `?limit=` into the inclusive bounds Supabase's `.range()` wants.
 *
 * An out-of-range limit is clamped rather than rejected: a stray `?limit=100` from a
 * shared link should return 50 rows, not a 400 the visitor cannot act on.
 *
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
 * @returns {{ total: number, page: number, limit: number }}
 */
function buildMeta(total, paging) {
  return { total, page: paging.page, limit: paging.limit };
}

module.exports = { parsePaging, buildMeta };
