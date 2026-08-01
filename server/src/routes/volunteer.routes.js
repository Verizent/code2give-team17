const express = require("express");
const { validate } = require("../middleware/validate");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const {
  createSignupSchema,
  createProgrammeInterestSchema,
  signupIdParamSchema,
} = require("../schemas/volunteer.schema");
const { envelope } = require("../lib/envelope");
const signupsService = require("../services/volunteering/signups.service");
const interestsService = require("../services/volunteering/interests.service");

const router = express.Router();

router.get("/me", requireAuth, async (request, response, next) => {
  try {
    const me = await signupsService.getVolunteerMe(request.user);
    response.json(envelope(me));
  } catch (error) {
    next(error);
  }
});

router.post(
  "/interest",
  optionalAuth,
  validate({ body: createProgrammeInterestSchema }),
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

      const volunteer = await signupsService.resolveVolunteer({
        email: body.email,
        full_name: body.full_name,
        phone: body.phone,
        locale: body.locale,
        user: request.user ?? null,
      });

      response.status(201).json(
        envelope({
          interest: null,
          volunteer: {
            id: volunteer.id,
            email: volunteer.email,
            full_name: volunteer.full_name,
          },
          opportunity: null,
          message: body.message ?? null,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/signups",
  optionalAuth,
  validate({ body: createSignupSchema }),
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
  validate({ params: signupIdParamSchema }),
  async (request, response, next) => {
    try {
      const cancelled = await signupsService.cancelSignup(
        request.validatedParams.id,
        request.user,
      );
      response.json(envelope(cancelled));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
