const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { envelope } = require("../lib/envelope");
const { ApiError } = require("../lib/api-error");
const {
  listCampaigns,
  moderateCampaign,
} = require("../services/campaigns.service");
const allocationsRepo = require("../data/allocations.repo");
const donationsRepo = require("../data/donations.repo");
const sessionsRepo = require("../data/sessions.repo");

const router = express.Router();

// DEMO-ONLY: no requireRole('admin') on this branch. Real auth (middleware/auth.js
// + require-role) lives on backend-dev; wire it in at merge time (CLAUDE.md §branches).
router.get("/campaigns", async (request, response, next) => {
  try {
    const items = await listCampaigns();
    response.json({ items, meta: { total: items.length } });
  } catch (error) {
    next(error);
  }
});

router.post("/campaigns/:slug/moderate", async (request, response, next) => {
  try {
    const campaign = await moderateCampaign(request.params.slug, request.body.status);
    response.json(campaign);
  } catch (error) {
    next(error);
  }
});

// ── Allocations admin surface (§16) ────────────────────────────────────────

const allocationParams = z.object({ id: z.string().uuid() });
const reassignSchema = z.strictObject({ session_id: z.string().uuid() });

/**
 * GET /api/admin/allocations
 *
 * Read-only list for the ops screen. Real production version would filter by donor,
 * status, and period — for the demo this returns everything and lets the client filter.
 */
router.get("/allocations", async (request, response, next) => {
  try {
    // No dedicated repo method for "all with joins" — the demo screen shows recent
    // activity, so we compose from what we have. A production version adds an SQL
    // view and a paged endpoint (§16).
    const donationsList = await donationsRepo.listRecentSucceeded?.(50);
    // Fallback if the helper isn't there — return empty rather than throw, since this
    // is a nice-to-have surface not the demo path.
    const items = donationsList ?? [];
    response.json(envelope(items, { total: items.length }));
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/allocations/:id
 *
 * Reassign an allocation to a different session — the §16 exception path when the
 * automatic pick was wrong. Validates that the new session is scheduled before writing.
 */
router.patch(
  "/allocations/:id",
  validate({ params: allocationParams, body: reassignSchema }),
  async (request, response, next) => {
    try {
      const target = await sessionsRepo.findById(request.validatedBody.session_id);
      if (!target || target.status !== "scheduled") {
        throw ApiError.badRequest("Target session must be scheduled");
      }
      await allocationsRepo.updateAllocation(request.validatedParams.id, {
        session_id: request.validatedBody.session_id,
      });
      response.json(envelope({ id: request.validatedParams.id, session_id: request.validatedBody.session_id }));
    } catch (error) {
      next(error);
    }
  },
);

// ── DEMO-ONLY controls (§16, §26) ──────────────────────────────────────────

const advanceParams = z.object({ id: z.string().uuid() });
const advanceSchema = z.strictObject({
  to: z.enum(["planned", "completed"]),
});

/**
 * POST /api/admin/demo/advance-donation/:id
 *
 * DEMO-ONLY: forces every allocation on a donation into the requested state. Used to
 * demonstrate the pending → planned → completed flow on stage in one click, rather
 * than waiting for real session lifecycle events. Must be removed or admin-gated
 * before any live deployment (§26 register).
 */
router.post(
  "/demo/advance-donation/:id",
  validate({ params: advanceParams, body: advanceSchema }),
  async (request, response, next) => {
    try {
      await allocationsRepo.bulkSetStatusForDonation(
        request.validatedParams.id,
        request.validatedBody.to,
      );
      response.json(envelope({ donation_id: request.validatedParams.id, status: request.validatedBody.to }));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
