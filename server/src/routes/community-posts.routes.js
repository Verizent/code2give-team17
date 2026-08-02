// DEMO-ONLY: no rate-limit on POST — real version needs express-rate-limit
//            (lockfile change for six people, §17 integration notes).
const express = require("express");
const { optionalAuth } = require("../middleware/require-auth");
const { validate } = require("../middleware/validate");
const { listQuerySchema } = require("../schemas/query.schema");
const { createCommunityPostSchema } = require("../schemas/community-post.schema");
const { envelope } = require("../lib/envelope");
const communityPostsService = require("../services/content/community-posts.service");

const router = express.Router();

router.get("/", validate({ query: listQuerySchema }), async (request, response, next) => {
  try {
    const { items, meta } = await communityPostsService.listVoices(request.validatedQuery);
    response.json(envelope(items, meta));
  } catch (error) {
    next(error);
  }
});

// optionalAuth: signed-in submissions get attributed via request.auth; anonymous
// submissions still succeed. A stale token must not block a submission a visitor could
// have made while signed out.
router.post(
  "/",
  optionalAuth,
  validate({ body: createCommunityPostSchema }),
  async (request, response, next) => {
    try {
      const result = await communityPostsService.submitVoice(request.body, request.auth);
      response.status(201).json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
