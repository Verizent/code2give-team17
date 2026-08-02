const express = require("express");
const { validate } = require("../middleware/validate");
const { optionalAuth } = require("../middleware/require-auth");
const opportunitiesService = require("../services/volunteering/opportunities.service");
const interestsService = require("../services/volunteering/interests.service");
const rateLimit = require("../middleware/rate-limit");
const { actorFromAuth } = require("../lib/actor");
const { envelope } = require("../lib/envelope");
const {
  listOpportunitiesQuerySchema,
  opportunityDetailQuerySchema,
  opportunityIdParamsSchema,
  createInterestBodySchema,
} = require("../schemas/volunteering.schema");

const router = express.Router();

router.get(
  "/",
  validate({ query: listOpportunitiesQuerySchema }),
  async (request, response, next) => {
    try {
      const { items, meta } = await opportunitiesService.listOpportunities(request.query);
      response.json(envelope(items, meta));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id",
  validate({ params: opportunityIdParamsSchema, query: opportunityDetailQuerySchema }),
  async (request, response, next) => {
    try {
      const item = await opportunitiesService.getOpportunityById(request.params.id);
      response.json(envelope(item));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/interest",
  optionalAuth,
  rateLimit({ key: "interest" }),
  validate({ params: opportunityIdParamsSchema, body: createInterestBodySchema }),
  async (request, response, next) => {
    try {
      const result = await interestsService.registerInterest(
        request.params.id,
        request.body,
        actorFromAuth(request.auth),
      );
      response.status(201).json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
