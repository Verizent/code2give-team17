const express = require("express");
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
      response.status(404).json({
        error: "Not Found",
        message: "Wishlist item not found",
        code: "NOT_FOUND",
      });
      return;
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
