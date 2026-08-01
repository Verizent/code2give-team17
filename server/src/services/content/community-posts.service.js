const communityPostsRepo = require("../../data/community-posts.repo");
const { ApiError } = require("../../lib/api-error");
const { parsePaging, buildMeta } = require("../../lib/pagination");

/**
 * `GET /api/community-posts` — approved Voices for the public tab.
 *
 * @param {{ page?: number, limit?: number }} query
 * @returns {Promise<{ items: object[], meta: { total: number, page: number, limit: number } }>}
 */
async function listVoices(query = {}) {
  const paging = parsePaging(query);
  const { rows, total } = await communityPostsRepo.listApproved({
    from: paging.from,
    to: paging.to,
  });
  return { items: rows, meta: buildMeta(total, paging) };
}

/**
 * `POST /api/community-posts` — a supporter, parent or volunteer submits a story.
 *
 * The `website` field is the honeypot. When it is filled, we return a fake 201 and write
 * nothing — telling a bot it was caught (with a 400) would reveal which field to omit.
 * This reads like a bug; it is deliberate.
 *
 * @param {{ author_name: string, relationship: string, story: string, photo_url?: string, contact_email?: string, consent_given: true, website?: string }} body
 * @returns {Promise<{ id: string | null, submitted_at: string }>}
 */
async function submitVoice(body) {
  const { website, ...postData } = body;

  if (website) {
    return { id: null, submitted_at: new Date().toISOString() };
  }

  return communityPostsRepo.create(postData);
}

/**
 * `GET /api/admin/community-posts` — pending queue for the moderation UI.
 *
 * @param {{ page?: number, limit?: number }} query
 * @returns {Promise<{ items: object[], meta: { total: number, page: number, limit: number } }>}
 */
async function listPendingVoices(query = {}) {
  const paging = parsePaging(query);
  const { rows, total } = await communityPostsRepo.listPending({
    from: paging.from,
    to: paging.to,
  });
  return { items: rows, meta: buildMeta(total, paging) };
}

/**
 * `POST /api/admin/community-posts/:id/moderate` — approve or reject a submission.
 *
 * @param {string} id
 * @param {{ status: 'approved'|'rejected', moderation_note?: string }} body
 * @returns {Promise<object>}
 */
async function moderateVoice(id, body) {
  const row = await communityPostsRepo.moderate(id, body);
  if (!row) {
    throw ApiError.notFound(`No community post with id "${id}"`);
  }
  return row;
}

module.exports = { listVoices, submitVoice, listPendingVoices, moderateVoice };
