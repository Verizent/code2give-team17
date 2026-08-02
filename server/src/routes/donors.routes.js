const express = require("express");
const { validate } = require("../middleware/validate");
const { z } = require("zod");
const { envelope } = require("../lib/envelope");
const { ApiError } = require("../lib/api-error");
const { findDonorByToken, buildTrackView } = require("../services/donors.service");

const router = express.Router();

const tokenParamSchema = z.object({ token: z.string().min(1) });

// Archived editions are reachable via `?period=<id>` (§15). Default returns the current edition.
const trackQuerySchema = z.object({ period: z.string().uuid().optional() });

const recoverSchema = z.strictObject({ email: z.string().email() });

/**
 * GET /api/donors/track/:token
 *
 * The §15 tracking page. Bearer token in the URL — accepted deliberately, mitigated by
 * a long cryptographically random token, `X-Robots-Tag: noindex`, and no enumeration
 * endpoint. See §15 for the tradeoff.
 */
router.get(
  "/track/:token",
  validate({ params: tokenParamSchema, query: trackQuerySchema }),
  async (request, response, next) => {
    try {
      // §15 mitigation: search engines must never index a donor page.
      response.setHeader("X-Robots-Tag", "noindex, nofollow");

      const donor = await findDonorByToken(request.validatedParams.token);
      if (!donor) throw ApiError.notFound("Tracking page not found");

      const view = await buildTrackView(donor, {
        periodId: request.validatedQuery.period,
      });

      response.json(envelope(view));
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/donors/recover-link
 *
 * §15 recovery flow. Response is intentionally identical for known and unknown emails —
 * a differing response turns this form into an oracle for testing whether a named person
 * donated to a disability charity.
 *
 * DEMO-ONLY: no email actually sent yet. Resend integration is a real-branch concern —
 * the sandbox domain only delivers to verified addresses until DNS on love21foundation.com
 * is verified (§17, §19). No rate limiting either — real needs a sliding-window limiter
 * or this becomes an email-bombing tool. Marked in the §26 register.
 */
router.post(
  "/recover-link",
  validate({ body: recoverSchema }),
  async (request, response, next) => {
    try {
      response.json(envelope({ sent: true }));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
