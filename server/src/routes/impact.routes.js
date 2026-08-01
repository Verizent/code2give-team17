const express = require("express");
const { validate } = require("../middleware/validate");
const { localeQuerySchema } = require("../schemas/query.schema");
const { envelope } = require("../lib/envelope");
const impactService = require("../services/content/impact.service");

const router = express.Router();

router.get("/", validate({ query: localeQuerySchema }), async (request, response, next) => {
  try {
    response.json(envelope(await impactService.getCurrentImpact(request.validatedQuery.locale)));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
