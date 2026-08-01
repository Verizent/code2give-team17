const express = require("express");
const { validate } = require("../middleware/validate");
const { z } = require("zod");
const { envelope } = require("../lib/envelope");
const { createDonation } = require("../services/donations.service");

const router = express.Router();

// No `programme` field, deliberately — donors do not choose a designation and every gift is
// unrestricted (PLAN.md §3). Because this is a strictObject, a client still sending one gets a
// clear 400 rather than having the value silently dropped.
const createDonationSchema = z.strictObject({
  email:       z.string().email(),
  amount_hkd:  z.number().int().min(1),
  frequency:   z.enum(["once", "weekly", "monthly"]).optional(),
  campaign_id: z.string().uuid().optional(),
});

// POST /api/donations
router.post("/", validate({ body: createDonationSchema }), async (request, response, next) => {
  try {
    const result = await createDonation(request.body);
    response.status(201).json(envelope(result));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
