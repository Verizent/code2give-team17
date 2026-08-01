const express = require("express");
const { validate } = require("../middleware/validate");
const { z } = require("zod");
const { envelope } = require("../lib/envelope");
const { createDonation } = require("../services/donations.service");

const router = express.Router();

const createDonationSchema = z.strictObject({
  email:       z.string().email(),
  amount_hkd:  z.number().int().min(1),
  frequency:   z.enum(["once", "weekly", "monthly"]).optional(),
  programme:   z.enum(["sports", "fitness", "nutrition", "family", "where_needed"]).optional(),
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
