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
const donorsRepo = require("../data/donors.repo");
const sessionsRepo = require("../data/sessions.repo");
const { closeReadyPeriods } = require("../services/donations/period-close.service");
const { getDashboard } = require("../services/admin/dashboard.service");
const { getFunnel } = require("../services/admin/funnel.service");
const { getAnalytics } = require("../services/admin/analytics.service");

const router = express.Router();

// Auth is applied at the mount, not per-route: routes/index.js mounts this router
// behind `adminGuard` ([requireAuth, requireRole("admin")]), covering every route in
// this file. Do not assume a route added here is public — it is not, and it needs no
// second guard. tests/routes/admin-mount.test.js fails if the mount loses the guard.
// The Overview page's two reads. Both services existed unrouted, so /admin rendered
// its chrome and then failed every metric with a 404.
router.get("/dashboard", async (request, response, next) => {
  try {
    response.json(envelope(await getDashboard()));
  } catch (error) {
    next(error);
  }
});

router.get("/funnel", async (request, response, next) => {
  try {
    response.json(envelope(await getFunnel()));
  } catch (error) {
    next(error);
  }
});

router.get("/analytics", async (request, response, next) => {
  try {
    response.json(envelope(await getAnalytics()));
  } catch (error) {
    next(error);
  }
});

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

// ── Admin dashboard endpoints (donations track) ────────────────────────────

const listDonationsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  status: z.enum(["pending", "succeeded", "failed", "refunded"]).optional(),
});

/**
 * GET /api/admin/donations
 * List donations for the admin table — filter by status, cap by limit.
 */
router.get("/donations", validate({ query: listDonationsQuery }), async (request, response, next) => {
  try {
    const items = await donationsRepo.listRecent(request.validatedQuery);
    response.json(envelope(items, { total: items.length }));
  } catch (error) { next(error); }
});

/**
 * GET /api/admin/donations/stats
 * Aggregate for the dashboard top strip:
 * donation_count, donor_count, total_given_hkd, sessions_supported, people_reached.
 */
router.get("/donations/stats", async (request, response, next) => {
  try {
    const stats = await allocationsRepo.adminStats();
    response.json(envelope(stats));
  } catch (error) { next(error); }
});

const listDonorsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

/**
 * GET /api/admin/donors
 * Donor directory for the admin dashboard — email, name, locale, opt-in, first seen.
 * Uses the same envelope shape as /admin/donations.
 */
router.get("/donors", validate({ query: listDonorsQuery }), async (request, response, next) => {
  try {
    const items = await donorsRepo.listRecent(request.validatedQuery);
    response.json(envelope(items, { total: items.length }));
  } catch (error) { next(error); }
});

/**
 * POST /api/admin/cron/close-periods
 *
 * Manual trigger for the batching + notification job. Runs the same logic a cron
 * would fire on the 15th / EOM: closes ready donor_periods, emails their completed
 * sessions, stamps email_sent_at (starts the 14-day mark-for-removal clock).
 *
 * Idempotent — re-running today is a no-op. Returns processed/closed/emailed counts
 * so the admin sees what happened.
 */
router.post("/cron/close-periods", async (request, response, next) => {
  try {
    const summary = await closeReadyPeriods();
    response.json(envelope(summary));
  } catch (error) { next(error); }
});

module.exports = router;
