const express = require("express");
const { validate } = require("../../middleware/validate");
const { listQuerySchema, idParamSchema, moderateSchema } = require("../../schemas/query.schema");
const { envelope } = require("../../lib/envelope");
const communityPostsService = require("../../services/content/community-posts.service");

const router = express.Router();

router.get("/", validate({ query: listQuerySchema }), async (request, response, next) => {
  try {
    const { items, meta } = await communityPostsService.listPendingVoices(request.validatedQuery);
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

module.exports = router;
