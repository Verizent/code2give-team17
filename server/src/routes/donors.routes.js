const express = require("express");
const { validate } = require("../middleware/validate");
const { z } = require("zod");
const { envelope } = require("../lib/envelope");
const { ApiError } = require("../lib/api-error");
const { findDonorByToken } = require("../services/donors.service");
const donationsRepo = require("../data/donations.repo");

const router = express.Router();

const tokenParamSchema = z.object({ token: z.string().min(1) });

const recoverSchema = z.strictObject({ email: z.string().email() });

// GET /api/donors/track/:token
router.get("/track/:token", validate({ params: tokenParamSchema }), async (request, response, next) => {
  try {
    const donor = await findDonorByToken(request.validatedParams.token);
    if (!donor) throw ApiError.notFound("Tracking page not found");

    const donations = await donationsRepo.listByDonor(donor.id);
    response.json(envelope({ donor: { email: donor.email, full_name: donor.full_name }, donations }));
  } catch (error) {
    next(error);
  }
});

// POST /api/donors/recover-link
// Uniform response for known AND unknown emails — privacy property (CONTEXT.md §15).
// DEMO-ONLY: email not actually sent. Resend only delivers to verified addresses until
// DNS on love21foundation.com is verified (CONTEXT.md §17, §19).
router.post("/recover-link", validate({ body: recoverSchema }), async (request, response, next) => {
  try {
    response.json(envelope({ sent: true }));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
