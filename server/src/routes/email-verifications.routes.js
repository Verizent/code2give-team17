const express = require("express");
const validate = require("../middleware/validate");
const rateLimit = require("../middleware/rate-limit");
const emailVerificationService = require("../services/volunteering/email-verification.service");
const {
  startEmailVerificationBodySchema,
  confirmEmailVerificationParamsSchema,
  confirmEmailVerificationBodySchema,
} = require("../schemas/volunteering.schema");

const router = express.Router();

router.post(
  "/",
  rateLimit({ key: "email-verification" }),
  validate({ body: startEmailVerificationBodySchema }),
  async (request, response, next) => {
    try {
      const result = await emailVerificationService.startVerification(request.body.email);
      response.status(201).json(result);
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
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
