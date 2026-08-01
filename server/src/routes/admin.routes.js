const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { listQuerySchema } = require("../schemas/query.schema");
const {
  moderateCampaignSchema,
  campaignIdParamSchema,
} = require("../schemas/campaign.schema");
const { envelope } = require("../lib/envelope");
const campaignsService = require("../services/donations/campaigns.service");
const dashboardService = require("../services/admin/dashboard.service");
const attendanceService = require("../services/admin/attendance.service");
const demoService = require("../services/admin/demo.service");
const communityPostsService = require("../services/content/community-posts.service");
const funnelService = require("../services/admin/funnel.service");
const proofsService = require("../services/admin/proofs.service");
const socialService = require("../services/admin/social.service");
const articlesService = require("../services/content/articles.service");
const {
  createArticleSchema,
  updateArticleSchema,
} = require("../schemas/article.schema");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

const adminCampaignListQuery = listQuerySchema.extend({
  status: z
    .enum(["pending_approval", "approved", "rejected", "all"])
    .default("pending_approval"),
});

const isoDateTime = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid ISO datetime",
  });

const attendanceQuerySchema = z.object({
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  locale: z.enum(["en", "zh-Hant"]).default("en"),
});

const signupIdParamSchema = z.strictObject({
  id: z.string().uuid(),
});

const attendanceBodySchema = z.strictObject({
  hours_logged: z.number().min(0).max(24).optional(),
});

const communityListQuery = listQuerySchema.extend({
  status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"),
});

const communityIdParamSchema = z.strictObject({
  id: z.string().uuid(),
});

const moderateCommunitySchema = z.strictObject({
  status: z.enum(["approved", "rejected"]),
});

const donationIdParamSchema = z.strictObject({
  id: z.string().uuid(),
});

const proofIdParamSchema = z.strictObject({
  id: z.string().uuid(),
});

const socialIdParamSchema = z.strictObject({
  id: z.string().uuid(),
});

const articleIdParamSchema = z.strictObject({
  id: z.string().uuid(),
});

const adminArticleListQuery = listQuerySchema.extend({
  status: z.enum(["draft", "published", "archived", "all"]).default("all"),
  category: z.enum(["news", "education", "report"]).optional(),
});

const socialPatchSchema = z.strictObject({
  scheduled_for: isoDateTime.nullable().optional(),
  status: z.enum(["draft", "queued", "copied"]).optional(),
});

const runNowParamSchema = z.strictObject({
  job: z.enum([
    "allocations",
    "auto-complete-sessions",
    "monthly-donor-email",
    "handson-sync",
  ]),
});

router.get("/dashboard", async (request, response, next) => {
  try {
    const data = await dashboardService.getDashboard();
    response.json(envelope(data));
  } catch (error) {
    next(error);
  }
});

router.get("/funnel", async (request, response, next) => {
  try {
    const data = await funnelService.getFunnel();
    response.json(envelope(data));
  } catch (error) {
    next(error);
  }
});

router.get("/proofs", async (request, response, next) => {
  try {
    const { items, available } = await proofsService.listAll();
    response.json(envelope(items, { available }));
  } catch (error) {
    next(error);
  }
});

router.post(
  "/proofs/:id/approve",
  validate({ params: proofIdParamSchema }),
  async (request, response, next) => {
    try {
      const proof = await proofsService.approve(request.validatedParams.id);
      response.json(envelope(proof));
    } catch (error) {
      next(error);
    }
  },
);

router.get("/social", async (request, response, next) => {
  try {
    const { items, available } = await socialService.list();
    response.json(envelope(items, { available }));
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/social/:id",
  validate({ params: socialIdParamSchema, body: socialPatchSchema }),
  async (request, response, next) => {
    try {
      const draft = await socialService.update(request.validatedParams.id, request.body);
      response.json(envelope(draft));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/social/:id/copy",
  validate({ params: socialIdParamSchema }),
  async (request, response, next) => {
    try {
      const draft = await socialService.markCopied(request.validatedParams.id);
      response.json(envelope(draft));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/articles",
  validate({ query: adminArticleListQuery }),
  async (request, response, next) => {
    try {
      const { items, meta, available } = await articlesService.listForAdmin(
        request.validatedQuery,
      );
      response.json(envelope(items, { ...meta, available }));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/articles/:id",
  validate({ params: articleIdParamSchema }),
  async (request, response, next) => {
    try {
      const article = await articlesService.getForAdmin(request.validatedParams.id);
      response.json(envelope(article));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/articles",
  validate({ body: createArticleSchema }),
  async (request, response, next) => {
    try {
      const article = await articlesService.createArticle(request.body);
      response.status(201).json(envelope(article));
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/articles/:id",
  validate({ params: articleIdParamSchema, body: updateArticleSchema }),
  async (request, response, next) => {
    try {
      const article = await articlesService.updateArticle(
        request.validatedParams.id,
        request.body,
      );
      response.json(envelope(article));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/articles/:id/publish",
  validate({ params: articleIdParamSchema }),
  async (request, response, next) => {
    try {
      const article = await articlesService.publishArticle(request.validatedParams.id);
      response.json(envelope(article));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/articles/:id/unpublish",
  validate({ params: articleIdParamSchema }),
  async (request, response, next) => {
    try {
      const article = await articlesService.unpublishArticle(request.validatedParams.id);
      response.json(envelope(article));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/attendance",
  validate({ query: attendanceQuerySchema }),
  async (request, response, next) => {
    try {
      const q = request.validatedQuery;
      const now = new Date();
      const from = q.from
        ? new Date(q.from)
        : startOfWeek(now);
      const to = q.to
        ? new Date(q.to)
        : (() => {
            const end = new Date(from);
            end.setUTCDate(end.getUTCDate() + 7);
            return end;
          })();

      const items = await attendanceService.listAttendance(
        from.toISOString(),
        to.toISOString(),
        q.locale,
      );
      response.json(
        envelope(items, {
          from: from.toISOString(),
          to: to.toISOString(),
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/volunteer-signups/:id/attendance",
  validate({ params: signupIdParamSchema, body: attendanceBodySchema }),
  async (request, response, next) => {
    try {
      const result = await attendanceService.markAttendance(
        request.validatedParams.id,
        request.body,
      );
      response.json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/campaigns",
  validate({ query: adminCampaignListQuery }),
  async (request, response, next) => {
    try {
      const { items, meta } = await campaignsService.listForAdmin(
        request.validatedQuery,
      );
      response.json(envelope(items, meta));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/campaigns/:id/moderate",
  validate({ params: campaignIdParamSchema, body: moderateCampaignSchema }),
  async (request, response, next) => {
    try {
      const campaign = await campaignsService.moderateCampaign(
        request.validatedParams.id,
        request.body.status,
      );
      response.json(envelope(campaign));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/community-posts",
  validate({ query: communityListQuery }),
  async (request, response, next) => {
    try {
      const { items, meta, available } = await communityPostsService.listForAdmin(
        request.validatedQuery,
      );
      response.json(envelope(items, { ...meta, available }));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/community-posts/:id/moderate",
  validate({ params: communityIdParamSchema, body: moderateCommunitySchema }),
  async (request, response, next) => {
    try {
      const post = await communityPostsService.moderate(
        request.validatedParams.id,
        request.body.status,
        request.user,
      );
      response.json(envelope(post));
    } catch (error) {
      next(error);
    }
  },
);

router.get("/demo/donations", async (request, response, next) => {
  try {
    const items = await demoService.listDemoDonations();
    response.json(envelope(items));
  } catch (error) {
    next(error);
  }
});

router.post(
  "/demo/advance-donation/:id",
  validate({ params: donationIdParamSchema }),
  async (request, response, next) => {
    try {
      const result = await demoService.advanceDonation(request.validatedParams.id);
      response.json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/demo/run-now/:job",
  validate({ params: runNowParamSchema }),
  async (request, response, next) => {
    try {
      const result = await demoService.runNow(request.validatedParams.job);
      response.json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @param {Date} date
 */
function startOfWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

module.exports = router;
