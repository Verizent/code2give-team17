/**
 * Wraps a successful payload in the CONTEXT.md §29 response envelope.
 *
 * Success and failure are told apart by **which key is present**: a 2xx carries `data`
 * and never `error`, an error carries `error` and never `data`. Nothing is nulled out to
 * make the two match, so `"data" in body` is never the check — the HTTP status is.
 *
 * This lives at the route layer on purpose. Services return domain results, so their
 * tests assert on the resource rather than on transport, and the envelope has exactly
 * one definition to change.
 *
 * @template T
 * @param {T} data
 * @param {{ total: number, page: number, limit: number }} [meta] Collections only.
 * @returns {{ data: T, meta?: { total: number, page: number, limit: number } }}
 */
function envelope(data, meta) {
  return meta === undefined ? { data } : { data, meta };
}

module.exports = { envelope };
