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
  // This endpoint sends real mail, so the address being mailed is the axis that matters most:
  // capping per IP alone still lets a spread of hosts bury one person's inbox. The two axes
  // deserve different budgets, so they are two limiters rather than one — a shared office NAT
  // legitimately produces more requests than any single address should receive.
  //
  // MAX_ATTEMPTS in email-verification.service.js does NOT cover this: that caps guesses
  // against an existing code, not how many codes we send.
  //
  // Both run before validate(), so request.body is parsed but not yet trusted — hence the
  // typeof check rather than assuming a string is there.
  rateLimit({
    key: "email-verification-address",
    limit: 5,
    identify: (request) =>
      typeof request.body?.email === "string" ? request.body.email.trim() : null,
  }),
  rateLimit({ key: "email-verification-ip", limit: 10 }),
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
