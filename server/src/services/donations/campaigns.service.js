const { ApiError } = require("../../lib/api-error");
const { parsePaging, buildMeta } = require("../../lib/pagination");
const { slugify, uniqueSlug } = require("../../lib/slug");
const campaignsRepo = require("../../data/campaigns.repo");
const donationsRepo = require("../../data/donations.repo");

/** Shared by create and update: a fundraiser may not close in the past. */
function assertEndDateNotPast(endDate) {
  const end = new Date(`${endDate}T00:00:00Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (Number.isNaN(end.getTime()) || end < today) {
    throw ApiError.badRequest("end_date must be today or later");
  }
}

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
 * Slug read for detail + "Your campaigns". Pending and rejected are returned so
 * the creator can see status; only missing rows 404. The public directory still
 * lists approved fundraisers only (`listApproved`).
 *
 * @param {string} slug
 */
async function getBySlug(slug) {
  const campaign = await campaignsRepo.findBySlug(slug);
  if (!campaign) {
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
  assertEndDateNotPast(input.end_date);

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

/**
 * Edits an existing fundraiser.
 *
 * DEMO-ONLY: authorisation is admin-only, standing in for a real per-creator ownership
 * model — `campaigns` has no `owner_id`, so "the person who made it may edit it" is not
 * expressible without a migration. The creator's own list is client-side sessionStorage
 * (`campaign-store.ts`), which is a convenience, not a permission (§19).
 *
 * `slug`, `status` and `raised_hkd` are absent from `updateCampaignSchema`, so a client
 * that sends one gets a 400 rather than having it silently dropped (§29).
 *
 * @param {string} id
 * @param {{ title?: string, story?: string, goal_hkd?: number,
 *   cover_image_url?: string, end_date?: string }} patch
 */
async function updateCampaign(id, patch) {
  const existing = await campaignsRepo.findById(id);
  if (!existing) {
    throw ApiError.notFound("Campaign not found");
  }

  // An empty body is a client bug. Reporting success for a write that changed nothing is
  // the reading that costs someone an afternoon.
  if (!patch || Object.keys(patch).length === 0) {
    throw ApiError.badRequest("Provide at least one field to update");
  }

  if (patch.end_date !== undefined) {
    assertEndDateNotPast(patch.end_date);
  }

  return campaignsRepo.update(id, patch);
}

/**
 * Deletes a fundraiser, refusing once it has taken money.
 *
 * `donations_campaign_id_fkey` is ON DELETE SET NULL: Postgres will not refuse this, it
 * will null the link and leave the donations behind with nothing to attribute them to.
 * That is unrecoverable and completely silent, so the check lives here.
 *
 * Counts donations in **any** status — a `pending` row is a checkout still in flight, and
 * deleting under it would strip the campaign before the webhook lands.
 *
 * @param {string} id
 */
async function deleteCampaign(id) {
  const existing = await campaignsRepo.findById(id);
  if (!existing) {
    throw ApiError.notFound("Campaign not found");
  }

  const donationCount = await donationsRepo.countByCampaign(id);
  if (donationCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete a fundraiser with ${donationCount} donation(s) — rejecting it keeps the record intact`,
    );
  }

  await campaignsRepo.remove(id);
  return { id, deleted: true };
}

module.exports = {
  listApproved,
  listForAdmin,
  getBySlug,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  moderateCampaign,
};
