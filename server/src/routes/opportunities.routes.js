const express = require("express");
const { validate } = require("../middleware/validate");
const { optionalAuth } = require("../middleware/auth");
const { opportunityListQuerySchema, opportunityIdParamSchema } = require("../schemas/query.schema");
const { createInterestSchema } = require("../schemas/volunteer.schema");
const { envelope } = require("../lib/envelope");
const opportunitiesService = require("../services/volunteering/opportunities.service");
const interestsService = require("../services/volunteering/interests.service");

const router = express.Router();

router.get("/", validate({ query: opportunityListQuerySchema }), async (request, response, next) => {
  try {
    const { items, meta } = await opportunitiesService.listOpportunities(request.validatedQuery);
    response.json(envelope(items, meta));
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:id/interest",
  optionalAuth,
  validate({ params: opportunityIdParamSchema, body: createInterestSchema }),
  async (request, response, next) => {
    try {
      const result = await interestsService.registerInterest(
        request.validatedParams.id,
        request.body,
        request.user ?? null,
      );
      response.status(201).json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id",
  validate({ params: opportunityIdParamSchema }),
  async (request, response, next) => {
    try {
      const opportunity = await opportunitiesService.getOpportunityById(request.validatedParams.id);
      response.json(envelope(opportunity));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
