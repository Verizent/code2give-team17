const wishlistRepo = require("../../data/wishlist.repo");
const { ApiError } = require("../../lib/api-error");
const { parsePaging, buildMeta } = require("../../lib/pagination");

/**
 * `pledged` is derived, not editable.
 *
 * The counter is owned by the `pledge_wishlist_item` Postgres function, which clamps
 * atomically against `needed` and writes the matching `wishlist_pledges` row in the same
 * statement. Writing it from here would leave the counter disagreeing with the pledges
 * that actually exist, and nothing in the system ever reconciles the two.
 *
 * Rejected rather than stripped: silently dropping the field means an admin who typed a
 * number watches the save succeed and the value not change (§29 — the same reason create
 * bodies are `z.strictObject`).
 */
const DERIVED_FIELDS = ["pledged"];

/**
 * @param {object} body
 * @throws {ApiError} 400
 */
function refuseDerivedFields(body) {
  const offending = DERIVED_FIELDS.filter((field) => body?.[field] !== undefined);

  if (offending.length > 0) {
    throw ApiError.badRequest(
      `${offending.join(", ")} is derived from pledges and cannot be set directly`,
    );
  }
}

/**
 * Admin listing — includes inactive items, which the public read hides.
 *
 * @param {object} [query]
 * @returns {Promise<{ items: object[], meta: object }>}
 */
async function listItems(query = {}) {
  const paging = parsePaging(query);
  const { rows, total } = await wishlistRepo.listAll({ from: paging.from, to: paging.to });
  return { items: rows, meta: buildMeta(total, paging) };
}

/**
 * @param {string} id
 * @returns {Promise<object>}
 * @throws {ApiError} 404
 */
async function getItem(id) {
  const row = await wishlistRepo.findById(id);
  if (!row) {
    throw ApiError.notFound(`No wishlist item with id "${id}"`);
  }
  return row;
}

/**
 * @param {object} body
 * @returns {Promise<object>}
 * @throws {ApiError} 400
 */
async function createItem(body) {
  refuseDerivedFields(body);

  if (!Number.isInteger(body.needed) || body.needed < 1) {
    throw ApiError.badRequest("needed must be a positive integer");
  }

  return wishlistRepo.create(body);
}

/**
 * Reads before writing so `needed` can be checked against the pledges already recorded.
 *
 * @param {string} id
 * @param {object} body
 * @returns {Promise<object>}
 * @throws {ApiError} 400, 404
 */
async function updateItem(id, body) {
  refuseDerivedFields(body);

  const existing = await wishlistRepo.findById(id);
  if (!existing) {
    throw ApiError.notFound(`No wishlist item with id "${id}"`);
  }

  if (body.needed !== undefined) {
    if (!Number.isInteger(body.needed) || body.needed < 1) {
      throw ApiError.badRequest("needed must be a positive integer");
    }

    // Equal is allowed: 3 of 3 is fully subscribed, which is a legitimate way to close
    // an item. Only dropping below what supporters already pledged is refused, because
    // it would render the public card as "3 of 2 pledged".
    if (body.needed < existing.pledged) {
      throw ApiError.badRequest(
        `needed cannot be lower than the ${existing.pledged} already pledged`,
      );
    }
  }

  const row = await wishlistRepo.update(id, body);
  if (!row) {
    throw ApiError.notFound(`No wishlist item with id "${id}"`);
  }
  return row;
}

/**
 * @param {string} id
 * @returns {Promise<object>}
 * @throws {ApiError} 404
 */
async function deleteItem(id) {
  const row = await wishlistRepo.remove(id);
  if (!row) {
    throw ApiError.notFound(`No wishlist item with id "${id}"`);
  }
  return row;
}

module.exports = { listItems, getItem, createItem, updateItem, deleteItem };
