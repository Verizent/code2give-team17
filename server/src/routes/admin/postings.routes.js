const express = require("express");
const { validate } = require("../../middleware/validate");
const { envelope } = require("../../lib/envelope");
const adminOpportunitiesService = require("../../services/admin/opportunities.service");
const {
  createOpportunityBodySchema,
  updateOpportunityBodySchema,
  adminOpportunityListQuerySchema,
  opportunityIdParamsSchema,
} = require("../../schemas/opportunity.schema");

const router = express.Router();

router.get(
  "/",
  validate({ query: adminOpportunityListQuerySchema }),
  async (request, response, next) => {
    try {
      const { items, meta } = await adminOpportunitiesService.listForAdmin(
        request.validatedQuery,
      );
      response.json(envelope(items, meta));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/",
  validate({ body: createOpportunityBodySchema }),
  async (request, response, next) => {
    try {
      const row = await adminOpportunitiesService.createOpportunity(request.body);
      response.status(201).json(envelope(row));
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id",
  validate({ params: opportunityIdParamsSchema, body: updateOpportunityBodySchema }),
  async (request, response, next) => {
    try {
      const row = await adminOpportunitiesService.updateOpportunity(
        request.validatedParams.id,
        request.body,
      );
      response.json(envelope(row));
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:id",
  validate({ params: opportunityIdParamsSchema }),
  async (request, response, next) => {
    try {
      await adminOpportunitiesService.removeOpportunity(request.validatedParams.id);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
