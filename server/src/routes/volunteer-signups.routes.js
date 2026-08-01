const express = require("express");
const { validate } = require("../middleware/validate");
const volunteerContext = require("../middleware/volunteer-context");
const signupsService = require("../services/volunteering/signups.service");
const { envelope } = require("../lib/envelope");
const {
  createSignupBodySchema,
  listSignupsQuerySchema,
  signupIdParamsSchema,
} = require("../schemas/volunteering.schema");

const router = express.Router();

router.post(
  "/",
  volunteerContext,
  validate({ body: createSignupBodySchema }),
  async (request, response, next) => {
    try {
      const signup = await signupsService.createSignupForVolunteer(
        request.volunteer.id,
        request.body.opportunity_id,
        request.volunteer.profile_id,
      );
      response.status(201).json(envelope({ signup }));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/",
  volunteerContext,
  validate({ query: listSignupsQuerySchema }),
  async (request, response, next) => {
    try {
      const items = await signupsService.listSignups(request.volunteer.id, {
        opportunityId: request.query.opportunity_id,
      });
      response.json(envelope({ items }));
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:id",
  volunteerContext,
  validate({ params: signupIdParamsSchema }),
  async (request, response, next) => {
    try {
      await signupsService.deleteSignup(request.params.id, request.volunteer.id);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
