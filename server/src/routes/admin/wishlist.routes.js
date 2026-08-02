const express = require("express");
const { validate } = require("../../middleware/validate");
const { listQuerySchema } = require("../../schemas/query.schema");
const {
  wishlistIdParamSchema,
  createWishlistItemSchema,
  updateWishlistItemSchema,
} = require("../../schemas/wishlist.schema");
const { envelope } = require("../../lib/envelope");
const wishlistService = require("../../services/admin/wishlist.service");

const router = express.Router();

// Auth is applied at the mount, not per-route: routes/index.js mounts this behind
// `adminGuard` ([requireAuth, requireRole("admin")]). A route added here is NOT public.

router.get("/", validate({ query: listQuerySchema }), async (request, response, next) => {
  try {
    const { items, meta } = await wishlistService.listItems(request.validatedQuery);
    response.json(envelope(items, meta));
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:id",
  validate({ params: wishlistIdParamSchema }),
  async (request, response, next) => {
    try {
      response.json(envelope(await wishlistService.getItem(request.validatedParams.id)));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/",
  validate({ body: createWishlistItemSchema }),
  async (request, response, next) => {
    try {
      response.status(201).json(envelope(await wishlistService.createItem(request.body)));
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id",
  validate({ params: wishlistIdParamSchema, body: updateWishlistItemSchema }),
  async (request, response, next) => {
    try {
      const row = await wishlistService.updateItem(request.validatedParams.id, request.body);
      response.json(envelope(row));
    } catch (error) {
      next(error);
    }
  },
);

// 204 with no body, matching the other admin deletes (instagram, impact, sessions).
router.delete(
  "/:id",
  validate({ params: wishlistIdParamSchema }),
  async (request, response, next) => {
    try {
      await wishlistService.deleteItem(request.validatedParams.id);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
