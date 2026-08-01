const { ApiError } = require("../../lib/api-error");
const { parsePaging, buildMeta } = require("../../lib/pagination");
const { slugify, uniqueSlug } = require("../../lib/slug");
const campaignsRepo = require("../../data/campaigns.repo");

/**
 * Public directory — approved fundraisers only.
 *
 * @param {{ page?: unknown, limit?: unknown }} query
 */
async function listApproved(query) {
  const paging = parsePaging(query);
  const { rows, total } = await campaignsRepo.list({
    ...paging,
    status: "approved",
  });
  return { items: rows, meta: buildMeta(total, paging) };
}

/**
 * Admin / owner queue — optional status filter (defaults to pending_approval).
 *
 * @param {{ page?: unknown, limit?: unknown, status?: string }} query
 */
async function listForAdmin(query) {
  const paging = parsePaging(query);
  const status = query.status || "pending_approval";
  const { rows, total } = await campaignsRepo.list({
    ...paging,
    status: status === "all" ? undefined : status,
  });
  return { items: rows, meta: buildMeta(total, paging) };
}

/**
 * Public slug read. Rejected campaigns 404; pending is returned so the creator
 * can see the waiting state on `/c/:slug` after create.
 *
 * @param {string} slug
 */
async function getBySlug(slug) {
  const campaign = await campaignsRepo.findBySlug(slug);
  if (!campaign || campaign.status === "rejected") {
    throw ApiError.notFound("Campaign not found");
  }
  return campaign;
}

/**
 * New fundraisers always start as `pending_approval` (live check constraint).
 *
 * @param {{
 *   title: string,
 *   story: string,
 *   goal_hkd: number,
 *   cover_image_url: string,
 *   end_date: string,
 * }} input
 */
async function createCampaign(input) {
  const end = new Date(`${input.end_date}T00:00:00Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (Number.isNaN(end.getTime()) || end < today) {
    throw ApiError.badRequest("end_date must be today or later");
  }

  const base = slugify(input.title);
  const slug = await uniqueSlug(base, (candidate) =>
    campaignsRepo.slugExists(candidate),
  );

  return campaignsRepo.insert({
    slug,
    title: input.title,
    story: input.story,
    goal_hkd: input.goal_hkd,
    cover_image_url: input.cover_image_url,
    end_date: input.end_date,
    status: "pending_approval",
  });
}

/**
 * @param {string} id
 * @param {'approved' | 'rejected'} status
 */
async function moderateCampaign(id, status) {
  const existing = await campaignsRepo.findById(id);
  if (!existing) {
    throw ApiError.notFound("Campaign not found");
  }
  if (existing.status !== "pending_approval") {
    throw ApiError.badRequest("Only pending campaigns can be moderated");
  }
  return campaignsRepo.updateStatus(id, { status });
}

module.exports = {
  listApproved,
  listForAdmin,
  getBySlug,
  createCampaign,
  moderateCampaign,
};
