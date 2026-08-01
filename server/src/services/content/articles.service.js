const articlesRepo = require("../../data/articles.repo");
const { httpError } = require("../../lib/http-error");
const { parsePaging, buildMeta } = require("../../lib/pagination");
const { resolveLocale } = require("../../lib/locale");

const LIST_LOCALE_FIELDS = ["title", "excerpt", "cover_alt"];
const DETAIL_LOCALE_FIELDS = [
  ...LIST_LOCALE_FIELDS,
  "body",
  "meta_title",
  "meta_description",
];

/**
 * `GET /api/articles` — the News list for all three tabs and the Home featured strip.
 *
 * @param {{ page?: number, limit?: number, locale?: string, category?: string, tag?: string, is_featured?: boolean }} query
 * @returns {Promise<{ items: object[], meta: { total: number, page: number, limit: number } }>}
 */
async function listArticles(query = {}) {
  const paging = parsePaging(query);

  const { rows, total } = await articlesRepo.listPublished({
    category: query.category,
    tag: query.tag,
    isFeatured: query.is_featured,
    from: paging.from,
    to: paging.to,
  });

  return {
    items: rows.map((row) => resolveLocale(row, LIST_LOCALE_FIELDS, query.locale)),
    meta: buildMeta(total, paging),
  };
}

/**
 * `GET /api/articles/:slug` — the article detail page.
 *
 * @param {string} slug
 * @param {string} [locale]
 * @returns {Promise<object>}
 */
async function getArticleBySlug(slug, locale) {
  const row = await articlesRepo.findPublishedBySlug(slug);

  if (!row) {
    throw httpError(404, `No published article with slug "${slug}"`);
  }

  return resolveLocale(row, DETAIL_LOCALE_FIELDS, locale);
}

module.exports = { listArticles, getArticleBySlug };
