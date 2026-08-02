const express = require("express");
const { validate } = require("../middleware/validate");
const rateLimit = require("../middleware/rate-limit");
const { envelope } = require("../lib/envelope");
const emailVerificationService = require("../services/volunteering/email-verification.service");
const {
  startEmailVerificationBodySchema,
  confirmEmailVerificationParamsSchema,
  confirmEmailVerificationBodySchema,
} = require("../schemas/volunteering.schema");

const router = express.Router();

router.post(
  "/",
  // Per address. Enough for a genuine visitor who mistypes and retries, or whose first
  // code expires; well short of useful as a way to bomb someone's inbox.
  rateLimit({ key: "email-verification", limit: 5, windowMs: 15 * 60_000 }),
  validate({ body: startEmailVerificationBodySchema }),
  async (request, response, next) => {
    try {
      const result = await emailVerificationService.startVerification(request.body.email);
      response.status(201).json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  "/:id/confirmation",
  validate({
    params: confirmEmailVerificationParamsSchema,
    body: confirmEmailVerificationBodySchema,
  }),
  async (request, response, next) => {
    try {
      const result = await emailVerificationService.confirmVerification(
        request.params.id,
        request.body.code,
      );
      response.json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
