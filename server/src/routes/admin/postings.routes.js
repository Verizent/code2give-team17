const express = require("express");
const { validate } = require("../../middleware/validate");
const { envelope } = require("../../lib/envelope");
const adminOpportunitiesService = require("../../services/admin/opportunities.service");
const adminSignupsService = require("../../services/admin/signups.service");
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

// Admin dashboard reads — full signup roster and aggregate feedback for an
// opportunity. Both live under /api/admin/postings/:id since the resource is
// the posting; the sub-collection describes what to read about it.
router.get(
  "/:id/signups",
  validate({ params: opportunityIdParamsSchema }),
  async (request, response, next) => {
    try {
      const items = await adminSignupsService.listRosterForOpportunity(
        request.validatedParams.id,
      );
      response.json(envelope(items));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id/feedback",
  validate({ params: opportunityIdParamsSchema }),
  async (request, response, next) => {
    try {
      const summary = await adminSignupsService.summariseFeedback(
        request.validatedParams.id,
      );
      response.json(envelope(summary));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
