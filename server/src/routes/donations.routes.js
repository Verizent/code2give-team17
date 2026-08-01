const express = require("express");
const { validate } = require("../middleware/validate");
const { z } = require("zod");
const { envelope } = require("../lib/envelope");
const { ApiError } = require("../lib/api-error");
const { createDonation, submitFeedback } = require("../services/donations.service");
const { createCheckoutSession } = require("../services/donations/checkout.service");
const donationsRepo = require("../data/donations.repo");

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

// The donate form carries amount and frequency only. No email or name — Stripe Checkout
// collects those natively and the webhook reads them back (CONTEXT.md §15) — and no
// programme, because donors do not choose a designation (PLAN.md §3).
const checkoutSchema = z.strictObject({
  amount_hkd:      z.number().int().min(4),
  frequency:       z.enum(["once", "monthly"]).optional(),
  campaign_id:     z.string().uuid().optional(),
  tracking_opt_in: z.boolean().optional(),
});

const sessionParamSchema = z.object({ session_id: z.string().min(1) });

// PLAN.md §Phase C3 — post-payment optional feedback. Every field optional; strictObject
// so a client sending an unknown key gets a 400 rather than silently losing the value.
const feedbackParamSchema = z.object({ id: z.string().uuid() });
const feedbackBodySchema = z.strictObject({
  message: z.string().max(2000).optional(),
  referral_source: z.string().max(120).optional(),
  referral_source_other: z.string().max(200).optional(),
  is_anonymous: z.boolean().optional(),
});

// POST /api/donations/checkout — the real payment path.
router.post("/checkout", validate({ body: checkoutSchema }), async (request, response, next) => {
  try {
    const result = await createCheckoutSession(request.body, {
      clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    });
    response.status(201).json(envelope(result));
  } catch (error) {
    next(error);
  }
});

// GET /api/donations/session/:session_id — thanks-page poll while the webhook lands.
// Keyed on the unguessable Stripe session id, so it needs no auth. `tracking_token` appears
// only once the donation actually succeeded and the donor opted in.
router.get(
  "/session/:session_id",
  validate({ params: sessionParamSchema }),
  async (request, response, next) => {
    try {
      const donation = await donationsRepo.findByStripeSession(request.validatedParams.session_id);
      if (!donation) throw ApiError.notFound("No donation found for that checkout session");

      response.json(
        envelope({
          status: donation.status,
          amount_hkd: donation.amount_hkd,
          frequency: donation.frequency,
          events_credited: donation.events_credited,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/donations
// DEMO-ONLY: writes a succeeded donation with no payment — kept so anything already
// integrated keeps working. Real path is POST /api/donations/checkout above.
router.post("/", validate({ body: createDonationSchema }), async (request, response, next) => {
  try {
    const result = await createDonation(request.body);
    response.status(201).json(envelope(result));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/donations/:id/feedback
 *
 * Post-payment optional feedback (PLAN.md §Phase C3): message, referral_source,
 * referral_source_other, is_anonymous. Rejects if the donation is not `succeeded`.
 * Never on the donate form — the donate form deliberately collects nothing extra (§15).
 */
router.post(
  "/:id/feedback",
  validate({ params: feedbackParamSchema, body: feedbackBodySchema }),
  async (request, response, next) => {
    try {
      const result = await submitFeedback(request.validatedParams.id, request.body);
      response.json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
