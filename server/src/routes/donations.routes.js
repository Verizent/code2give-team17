const express = require("express");
const { validate } = require("../middleware/validate");
const { z } = require("zod");
const { envelope } = require("../lib/envelope");
const {
  createDonation,
  submitFeedback,
  getCheckoutStatus,
} = require("../services/donations.service");
const { createCheckoutSession } = require("../services/donations/checkout.service");
const { REFERRAL_SOURCES } = require("../services/donors.service");
const donorsRepo = require("../data/donors.repo");
const { normalizeEmail } = require("../lib/normalize");
const rateLimit = require("../middleware/rate-limit");

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
  // Bounds mirror MIN/MAX_AMOUNT_HKD in checkout.service.js. The max is load-bearing: above it
  // the ×100 to cents exceeds Stripe's own unit_amount ceiling and the SDK throws mid-call,
  // which reached the client as a 500 quoting a raw Stripe message instead of a 400.
  amount_hkd:      z.number().int().min(4).max(1_000_000),
  // Matches the `donations_frequency_check` constraint and the three buttons the donate form
  // shows. This previously omitted "weekly", so a donor who picked Weekly either got a 400 or
  // was quietly billed monthly, depending on which side did the mapping.
  frequency:       z.enum(["once", "weekly", "monthly"]).optional(),
  campaign_id:     z.string().uuid().optional(),
  tracking_opt_in: z.boolean().optional(),
  // "How did you hear about Love 21" — optional, multi-select, recorded once per donor
  // (see upsertDonor). Not a property of this gift, which is why it is not stored on the
  // donation row; it rides along because the donate form is where we ask.
  referral_sources: z.array(z.enum(REFERRAL_SOURCES)).max(REFERRAL_SOURCES.length).optional(),
  referral_source_other: z.string().trim().max(200).optional(),
});

const sessionParamSchema = z.object({ session_id: z.string().min(1) });

const referralStatusQuerySchema = z.object({ email: z.string().trim().email().max(254) });

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
      response.json(envelope(await getCheckoutStatus(request.validatedParams.session_id)));
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/donations/referral-status?email=…
 *
 * Answers one question for the donate form: has this address already told us how it found
 * Love 21? If so the form hides that block, because it is asked once per donor.
 *
 * The response is a bare `{ answered: boolean }` and nothing else. It is unauthenticated —
 * it has to be, the donate form has no session — which makes it a way to test whether an
 * address is a known donor. Returning only the boolean keeps that to a yes/no rather than
 * exposing a name, gift history, or the tracking token, and the answer is identical for an
 * address that has never donated and one that donated without ever answering.
 *
 * NOTE: `rateLimit` is still the DEMO-ONLY no-op stub (src/middleware/rate-limit.js), so it
 * throttles nothing today. It is wired here so this route is covered the moment that stub
 * grows a real store — of everything we serve, this is the one where enumeration costs us.
 */
router.get(
  "/referral-status",
  rateLimit({ key: "referral-status" }),
  validate({ query: referralStatusQuerySchema }),
  async (request, response, next) => {
    try {
      const email = normalizeEmail(request.validatedQuery.email);
      response.json(envelope({ answered: await donorsRepo.hasReferralSources(email) }));
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
