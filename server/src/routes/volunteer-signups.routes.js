const express = require("express");
const { validate } = require("../middleware/validate");
const volunteerContext = require("../middleware/volunteer-context");
const signupsService = require("../services/volunteering/signups.service");
const feedbackService = require("../services/volunteering/signup-feedback.service");
const signupsRepo = require("../data/volunteer-signups.repo");
const { envelope } = require("../lib/envelope");
const { ApiError } = require("../lib/api-error");
const {
  createSignupBodySchema,
  listSignupsQuerySchema,
  signupIdParamsSchema,
} = require("../schemas/volunteering.schema");
const {
  patchSignupBodySchema,
  signupIdParamsSchema: patchSignupIdParamsSchema,
} = require("../schemas/signup-feedback.schema");

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

// PATCH /:id — capture §23 discovery + feedback fields on a signup.
// Owner-checked: the caller's resolved volunteer must own the row. Prevents a
// stray token from writing motivation/rating on someone else's signup.
router.patch(
  "/:id",
  volunteerContext,
  validate({ params: patchSignupIdParamsSchema, body: patchSignupBodySchema }),
  async (request, response, next) => {
    try {
      const existing = await signupsRepo.findSignupById(request.params.id);
      if (!existing) {
        throw ApiError.notFound("Signup not found");
      }
      if (existing.volunteer_id !== request.volunteer.id) {
        throw ApiError.forbidden("You cannot modify a signup you do not own");
      }
      const updated = await feedbackService.patchSignup(request.params.id, request.body);
      response.json(envelope(updated));
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
