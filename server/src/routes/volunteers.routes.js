const express = require("express");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/require-auth");
const volunteersService = require("../services/volunteering/volunteers.service");
const {
  createVolunteerBodySchema,
  volunteerTokenParamsSchema,
} = require("../schemas/volunteering.schema");

const router = express.Router();

router.post(
  "/",
  validate({ body: createVolunteerBodySchema }),
  async (request, response, next) => {
    try {
      const result = await volunteersService.registerVolunteer(request.body);
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:token",
  validate({ params: volunteerTokenParamsSchema }),
  async (request, response, next) => {
    try {
      const page = await volunteersService.getVolunteerPage(request.params.token);
      response.json(page);
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  "/:token/account",
  requireAuth,
  validate({ params: volunteerTokenParamsSchema }),
  async (request, response, next) => {
    try {
      const result = await volunteersService.claimPermanentAccount(
        request.params.token,
        request.auth.userId,
      );
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
