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

async function getAdminArticle(slug) {
  const row = await articlesRepo.findBySlug(slug);
  if (!row) throw ApiError.notFound(`No article with slug "${slug}"`);
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

async function updateAdminArticle(slug, body) {
  // Title change must never re-derive slug — slug is only changed when sent explicitly.
  const { slug: _ignored, ...patch } = body;
  if (body.slug !== undefined) patch.slug = body.slug;
  if (body.body_en !== undefined || body.body_zh !== undefined) {
    patch.reading_time_minutes = readingTime([
      ...(body.body_en ?? []),
      ...(body.body_zh ?? []),
    ]);
  }
  const row = await articlesRepo.update(slug, patch);
  if (!row) throw ApiError.notFound(`No article with slug "${slug}"`);
  return row;
}

async function deleteAdminArticle(slug) {
  const row = await articlesRepo.update(slug, { status: "archived" });
  if (!row) throw ApiError.notFound(`No article with slug "${slug}"`);
  return row;
}

module.exports = {
  listAdminArticles,
  getAdminArticle,
  createAdminArticle,
  updateAdminArticle,
  deleteAdminArticle,
};
