/**
 * Wraps a successful payload in the CONTEXT.md §29 response envelope.
 *
 * @template T
 * @param {T} data
 * @param {{ total: number, page: number, limit: number }} [meta]
 * @returns {{ data: T, meta?: { total: number, page: number, limit: number } }}
 */
function envelope(data, meta) {
  return meta === undefined ? { data } : { data, meta };
}

module.exports = { envelope };
