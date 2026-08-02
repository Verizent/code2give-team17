const express = require("express");
const { ApiError } = require("../lib/api-error");
const {
  listWishlistItems,
  getWishlistItem,
  createPledge,
} = require("../services/wishlist.service");

const router = express.Router();

router.get("/", async (request, response, next) => {
  try {
    const items = await listWishlistItems();
    response.json({ items, meta: { total: items.length } });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (request, response, next) => {
  try {
    const item = await getWishlistItem(request.params.id);
    if (!item) {
      // Thrown rather than hand-rolled: middleware/error-handler.js produces the same
      // { error, message, code } body, and a literal response.status().json() here is
      // how the envelope drifts (§29). Response shape is unchanged.
      throw ApiError.notFound("Wishlist item not found");
    }
    response.json(item);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/pledge", async (request, response, next) => {
  try {
    const result = await createPledge(request.params.id, request.body);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
