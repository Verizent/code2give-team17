const { ApiError } = require("../../lib/api-error");
const { isMissingTable } = require("../../lib/missing-table");
const { parsePaging, buildMeta } = require("../../lib/pagination");
const communityPostsRepo = require("../../data/community-posts.repo");

/**
 * Thin Voices moderation queue. Returns empty + unavailable when the table
 * is not applied yet (CONTENT migrations still pending — §28).
 *
 * @param {{ page?: unknown, limit?: unknown, status?: string }} query
 */
async function listForAdmin(query) {
  const paging = parsePaging(query);
  const status = query.status || "pending";
  try {
    const { rows, total } = await communityPostsRepo.list({
      ...paging,
      status: status === "all" ? undefined : status,
    });
    return {
      items: rows,
      meta: buildMeta(total, paging),
      available: true,
    };
  } catch (error) {
    if (isMissingTable(error, "community_posts")) {
      return {
        items: [],
        meta: buildMeta(0, paging),
        available: false,
      };
    }
    throw error;
  }
}

/**
 * @param {string} id
 * @param {'approved' | 'rejected'} status
 * @param {{ id?: string } | null} [moderator]
 */
async function moderate(id, status, moderator = null) {
  let existing;
  try {
    existing = await communityPostsRepo.findById(id);
  } catch (error) {
    if (isMissingTable(error, "community_posts")) {
      throw ApiError.badRequest(
        "Voices moderation is unavailable until community_posts is applied",
      );
    }
    throw error;
  }
  if (!existing) {
    throw ApiError.notFound("Community post not found");
  }
  if (existing.status !== "pending") {
    throw ApiError.badRequest("Only pending posts can be moderated");
  }
  return communityPostsRepo.updateModeration(id, {
    status,
    moderated_by: moderator?.id ?? null,
  });
}

module.exports = { listForAdmin, moderate };
