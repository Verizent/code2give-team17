const express = require("express");
const { validate } = require("../middleware/validate");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { recordDonationSchema } = require("../schemas/donation.schema");
const { envelope } = require("../lib/envelope");
const donationsService = require("../services/donations/donations.service");

const router = express.Router();

router.get("/me", requireAuth, async (request, response, next) => {
  try {
    const me = await donationsService.getDonationsMe(request.user);
    response.json(envelope(me));
  } catch (error) {
    next(error);
  }
});

/** Persist a gift without Stripe (local/demo checkout path, or pre-payment row). */
router.post(
  "/record",
  optionalAuth,
  validate({ body: recordDonationSchema }),
  async (request, response, next) => {
    try {
      const result = await donationsService.recordDonation(
        request.body,
        request.user ?? null,
      );
      response.status(201).json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
