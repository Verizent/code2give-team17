const express = require("express");
const { validate } = require("../middleware/validate");
const {
  recoverLinkSchema,
  notifySchema,
  trackTokenParamSchema,
} = require("../schemas/donation.schema");
const { envelope } = require("../lib/envelope");
const donationsService = require("../services/donations/donations.service");

const router = express.Router();

router.get(
  "/track/:token",
  validate({ params: trackTokenParamSchema }),
  async (request, response, next) => {
    try {
      const result = await donationsService.trackByToken(request.validatedParams.token);
      response.json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/recover-link",
  validate({ body: recoverLinkSchema }),
  async (request, response, next) => {
    try {
      const result = await donationsService.recoverLink(request.body.email);
      response.json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

router.post("/notify", validate({ body: notifySchema }), async (request, response, next) => {
  try {
    const result = await donationsService.notifyGiftJourney(request.body);
    response.json(envelope(result));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
