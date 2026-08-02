const articlesRepo = require("../../data/articles.repo");
const { ApiError } = require("../../lib/api-error");
const { parsePaging, buildMeta } = require("../../lib/pagination");
const { slugify, uniqueSlug } = require("../../lib/slug");
const { readingTime } = require("../../lib/reading-time");

async function listAdminArticles(query = {}) {
  const paging = parsePaging(query);
  const { rows, total } = await articlesRepo.listAll({
    category: query.category,
    status: query.status,
    from: paging.from,
    to: paging.to,
  });
  return { items: rows, meta: buildMeta(total, paging) };
}

async function getAdminArticle(id) {
  const row = await articlesRepo.findById(id);
  if (!row) throw ApiError.notFound(`No article with id "${id}"`);
  return row;
}

async function createAdminArticle(body) {
  const base = slugify(body.title_en || body.title_zh || "");
  const slug = await uniqueSlug(base, articlesRepo.slugExists);
  const reading_time_minutes = readingTime([
    ...(body.body_en ?? []),
    ...(body.body_zh ?? []),
  ]);
  return articlesRepo.create({ ...body, slug, reading_time_minutes });
}

async function updateAdminArticle(id, body) {
  // Title change must never re-derive slug — slug is only changed when sent explicitly.
  const { slug: _ignored, ...patch } = body;
  if (body.slug !== undefined) patch.slug = body.slug;
  if (body.body_en !== undefined || body.body_zh !== undefined) {
    patch.reading_time_minutes = readingTime([
      ...(body.body_en ?? []),
      ...(body.body_zh ?? []),
    ]);
  }
  const row = await articlesRepo.updateById(id, patch);
  if (!row) throw ApiError.notFound(`No article with id "${id}"`);
  return row;
}

async function deleteAdminArticle(id) {
  const row = await articlesRepo.updateById(id, { status: "archived" });
  if (!row) throw ApiError.notFound(`No article with id "${id}"`);
  return row;
}

/**
 * Publishing is a transition with a side effect, not a field assignment.
 *
 * §29 keeps `status` and `published_at` out of the write schemas because both are
 * server-derived. Allowing `status` through updateArticleSchema would let a caller set
 * status='published' while leaving published_at null — a row claiming to be published
 * with no publication date, which every reader downstream would then have to defend
 * against. The two move together here or not at all.
 *
 * @param {string} id
 */
async function publishAdminArticle(id) {
  const existing = await articlesRepo.findById(id);
  if (!existing) throw ApiError.notFound(`No article with id "${id}"`);

  const row = await articlesRepo.updateById(id, {
    status: "published",
    // Only stamped on the first publication, so re-publishing does not rewrite history.
    published_at: existing.published_at ?? new Date().toISOString(),
  });

  return row;
}

/**
 * Returns an article to draft.
 *
 * `published_at` is deliberately kept: it records when the article first went live, and
 * clearing it would make a later re-publish look like a first publication.
 *
 * @param {string} id
 */
async function unpublishAdminArticle(id) {
  const existing = await articlesRepo.findById(id);
  if (!existing) throw ApiError.notFound(`No article with id "${id}"`);

  return articlesRepo.updateById(id, { status: "draft" });
}

module.exports = {
  listAdminArticles,
  getAdminArticle,
  createAdminArticle,
  updateAdminArticle,
  deleteAdminArticle,
  publishAdminArticle,
  unpublishAdminArticle,
};
