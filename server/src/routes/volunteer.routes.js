const express = require("express");
const { validate } = require("../middleware/validate");
const rateLimit = require("../middleware/rate-limit");
const { requireAuth, optionalAuth } = require("../middleware/require-auth");
const volunteerContext = require("../middleware/volunteer-context");
const signupsService = require("../services/volunteering/signups.service");
const interestsService = require("../services/volunteering/interests.service");
const badgesRepo = require("../data/badges.repo");
const volunteersRepo = require("../data/volunteers.repo");
const signupsRepo = require("../data/volunteer-signups.repo");
const { actorFromAuth } = require("../lib/actor");
const { envelope } = require("../lib/envelope");
const { normalizeEmail } = require("../lib/normalize-email");
const {
  guestSignupBodySchema,
  createProgrammeInterestBodySchema,
  signupIdParamsSchema,
  discoveryStatusQuerySchema,
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

/**
 * GET /api/volunteer/discovery-status?email=…
 *
 * Answers one question for the signup form: has this address already told us how it found
 * Love 21? If so the form hides that block, because it is asked once per volunteer.
 *
 * Mirrors GET /api/donations/referral-status, and for the same reasons. The response is a
 * bare `{ answered: boolean }`. It has to be unauthenticated — the signup form has no
 * session — which makes it a way to test whether an address is a known volunteer. Returning
 * only the boolean keeps that to a yes/no rather than exposing a name, history or the
 * access token, and the answer is identical for an address that has never volunteered and
 * one that volunteered without ever answering.
 *
 * That last point matters more here than for donors: §15's reasoning is that a differing
 * response turns the form into an oracle for whether a named person is involved with a
 * Down syndrome and autism charity.
 */
router.get(
  "/discovery-status",
  // Generous because the form calls this from a debounced onChange while an address is
  // typed, so one honest volunteer makes a handful. 30 per 15 minutes still leaves
  // enumeration useless — probing a meaningful list would take days.
  rateLimit({ key: "discovery-status", limit: 30, windowMs: 15 * 60_000 }),
  validate({ query: discoveryStatusQuerySchema }),
  async (request, response, next) => {
    try {
      const email = normalizeEmail(request.validatedQuery?.email ?? request.query.email);
      response.json(envelope({ answered: await volunteersRepo.hasDiscoverySources(email) }));
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
          actorFromAuth(request.auth),
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
      const result = await signupsService.createSignup(request.body, actorFromAuth(request.auth));
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
      // requireAuth guarantees request.auth here, so the actor is never null and
      // cancelSignup's ownership check always has an identity to compare against.
      const cancelled = await signupsService.cancelSignup(
        request.params.id,
        actorFromAuth(request.auth),
      );
      response.json(envelope(cancelled));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
