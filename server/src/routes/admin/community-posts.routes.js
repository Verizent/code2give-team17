const express = require("express");
const { validate } = require("../../middleware/validate");
const {
  idParamSchema,
  moderateSchema,
  voicesListQuerySchema,
} = require("../../schemas/query.schema");
const { envelope } = require("../../lib/envelope");
const communityPostsService = require("../../services/content/community-posts.service");

const router = express.Router();

router.get("/", validate({ query: voicesListQuerySchema }), async (request, response, next) => {
  try {
    const { items, meta } = await communityPostsService.listVoicesByStatus(
      request.validatedQuery,
    );
    response.json(envelope(items, meta));
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:id/moderate",
  validate({ params: idParamSchema, body: moderateSchema }),
  async (request, response, next) => {
    try {
      const row = await communityPostsService.moderateVoice(
        request.validatedParams.id,
        request.body,
      );
      response.json(envelope(row));
    } catch (error) {
      next(error);
    }
  },
);

// 204 with no body, matching DELETE /api/admin/instagram/:id. The row is gone, so there
// is no resource left to return and an envelope would be describing nothing.
router.delete("/:id", validate({ params: idParamSchema }), async (request, response, next) => {
  try {
    await communityPostsService.deleteVoice(request.validatedParams.id);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
