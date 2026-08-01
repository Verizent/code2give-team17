const express = require("express");
const { validate } = require("../middleware/validate");
const { requireAuth, optionalAuth } = require("../middleware/require-auth");
const volunteerContext = require("../middleware/volunteer-context");
const signupsService = require("../services/volunteering/signups.service");
const interestsService = require("../services/volunteering/interests.service");
const badgesRepo = require("../data/badges.repo");
const signupsRepo = require("../data/volunteer-signups.repo");
const { envelope } = require("../lib/envelope");
const {
  guestSignupBodySchema,
  createProgrammeInterestBodySchema,
  signupIdParamsSchema,
} = require("../schemas/volunteering.schema");

const router = express.Router();

router.get(
  "/me",
  requireAuth,
  volunteerContext,
  async (request, response, next) => {
    try {
      const volunteer = request.volunteer;
      const [totalHours, badges, signups] = await Promise.all([
        signupsRepo.sumHoursForVolunteer(volunteer.id),
        badgesRepo.listBadgesForVolunteer(volunteer.id),
        signupsService.listSignups(volunteer.id),
      ]);

      response.json(
        envelope({
          id: volunteer.id,
          email: volunteer.email,
          full_name: volunteer.full_name,
          locale: volunteer.locale,
          claimed_at: volunteer.claimed_at,
          total_hours: totalHours,
          badges,
          signups,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/interest",
  optionalAuth,
  validate({ body: createProgrammeInterestBodySchema }),
  async (request, response, next) => {
    try {
      const { opportunity_id, ...body } = request.body;

      if (opportunity_id) {
        const result = await interestsService.registerInterest(
          opportunity_id,
          body,
          request.user ?? null,
        );
        response.status(201).json(envelope(result));
        return;
      }

      const result = await interestsService.registerProgrammeInterest(body);
      response.status(201).json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/signups",
  optionalAuth,
  validate({ body: guestSignupBodySchema }),
  async (request, response, next) => {
    try {
      const result = await signupsService.createSignup(request.body, request.user ?? null);
      response.status(201).json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/signups/:id",
  requireAuth,
  validate({ params: signupIdParamsSchema }),
  async (request, response, next) => {
    try {
      const cancelled = await signupsService.cancelSignup(request.params.id, request.user);
      response.json(envelope(cancelled));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
