const { ApiError } = require("../../lib/api-error");
const { isMissingTable } = require("../../lib/missing-table");
const socialDraftsRepo = require("../../data/social-drafts.repo");

/**
 * Caption drafts for Instagram/Facebook. Status tracks staff workflow only —
 * this API never posts to Meta Graph.
 *
 * @returns {Promise<{ items: object[], available: boolean }>}
 */
async function list() {
  try {
    const items = await socialDraftsRepo.listAll();
    return { items, available: true };
  } catch (error) {
    if (isMissingTable(error, "social_drafts")) {
      return { items: [], available: false };
    }
    throw error;
  }
}

/**
 * @param {string} id
 * @param {{ scheduled_for?: string | null, status?: 'draft' | 'queued' | 'copied' }} patch
 */
async function update(id, patch) {
  let existing;
  try {
    existing = await socialDraftsRepo.findById(id);
  } catch (error) {
    if (isMissingTable(error, "social_drafts")) {
      throw ApiError.badRequest(
        "Story desk is unavailable until social_drafts is applied (20260802_1130)",
      );
    }
    throw error;
  }
  if (!existing) throw ApiError.notFound("Social draft not found");

  /** @type {{ scheduled_for?: string | null, status?: string }} */
  const next = {};
  if (patch.scheduled_for !== undefined) {
    next.scheduled_for = patch.scheduled_for;
    if (patch.scheduled_for) next.status = "queued";
  }
  if (patch.status) next.status = patch.status;
  return socialDraftsRepo.update(id, next);
}

/**
 * Staff copied the caption to paste into Instagram/Facebook themselves.
 * @param {string} id
 */
async function markCopied(id) {
  return update(id, { status: "copied" });
}

module.exports = { list, update, markCopied };
