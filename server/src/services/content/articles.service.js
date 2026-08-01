const articlesRepo = require("../../data/articles.repo");
const { ApiError } = require("../../lib/api-error");
const { isMissingTable } = require("../../lib/missing-table");
const { parsePaging, buildMeta } = require("../../lib/pagination");
const { resolveLocale } = require("../../lib/locale");
const { slugify, uniqueSlug } = require("../../lib/slug");
const { readingTime } = require("../../lib/reading-time");

const LIST_LOCALE_FIELDS = ["title", "excerpt", "cover_alt"];
const DETAIL_LOCALE_FIELDS = [
  ...LIST_LOCALE_FIELDS,
  "body",
  "meta_title",
  "meta_description",
];

/**
 * Split plain text into paragraph blocks for the JSONB body schema.
 * @param {string | undefined} text
 * @returns {Array<{ type: 'paragraph', text: string }> | undefined}
 */
function textToParagraphBlocks(text) {
  if (text === undefined) return undefined;
  const parts = String(text)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return [];
  return parts.map((t) => ({ type: "paragraph", text: t }));
}

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
    throw ApiError.notFound(`No published article with slug "${slug}"`);
  }

  return resolveLocale(row, DETAIL_LOCALE_FIELDS, locale);
}

/**
 * Admin list — bilingual columns intact (no locale collapse).
 *
 * @param {{ page?: unknown, limit?: unknown, status?: string, category?: string }} query
 */
async function listForAdmin(query = {}) {
  const paging = parsePaging(query);
  try {
    const { rows, total } = await articlesRepo.listForAdmin({
      status: query.status || "all",
      category: query.category,
      from: paging.from,
      to: paging.to,
    });
    return {
      items: rows,
      meta: buildMeta(total, paging),
      available: true,
    };
  } catch (error) {
    if (isMissingTable(error, "articles")) {
      return { items: [], meta: buildMeta(0, paging), available: false };
    }
    throw error;
  }
}

/**
 * @param {string} id
 */
async function getForAdmin(id) {
  let row;
  try {
    row = await articlesRepo.findById(id);
  } catch (error) {
    if (isMissingTable(error, "articles")) {
      throw ApiError.badRequest(
        "Articles CMS is unavailable until the articles migration is applied",
      );
    }
    throw error;
  }
  if (!row) throw ApiError.notFound("Article not found");
  return row;
}

/**
 * Create a draft. Slug / status / reading_time / published_at are server-derived.
 *
 * @param {object} body — createArticleSchema shape; may include body_*_text helpers
 *   from the pragmatic admin form (stripped before insert if present via schema).
 */
async function createArticle(body) {
  const base = slugify(body.title_en);
  let slug;
  try {
    slug = await uniqueSlug(base, (candidate) => articlesRepo.slugExists(candidate));
  } catch (error) {
    if (isMissingTable(error, "articles")) {
      throw ApiError.badRequest(
        "Articles CMS is unavailable until the articles migration is applied",
      );
    }
    throw error;
  }

  const body_en = body.body_en ?? [];
  const body_zh = body.body_zh ?? [];

  const row = {
    slug,
    category: body.category,
    title_en: body.title_en,
    title_zh: body.title_zh ?? null,
    excerpt_en: body.excerpt_en ?? null,
    excerpt_zh: body.excerpt_zh ?? null,
    body_en,
    body_zh,
    cover_image_url: body.cover_image_url ?? null,
    cover_alt_en: body.cover_alt_en ?? null,
    cover_alt_zh: body.cover_alt_zh ?? null,
    attachment_url: body.attachment_url ?? null,
    author: body.author ?? null,
    tags: body.tags ?? [],
    is_featured: body.is_featured ?? false,
    meta_title_en: body.meta_title_en ?? null,
    meta_title_zh: body.meta_title_zh ?? null,
    meta_description_en: body.meta_description_en ?? null,
    meta_description_zh: body.meta_description_zh ?? null,
    og_image_url: body.og_image_url ?? null,
    status: "draft",
    published_at: null,
    reading_time_minutes: readingTime(body_en),
  };

  return articlesRepo.insert(row);
}

/**
 * @param {string} id
 * @param {object} body — updateArticleSchema
 */
async function updateArticle(id, body) {
  const existing = await getForAdmin(id);

  if (body.slug && body.slug !== existing.slug) {
    const taken = await articlesRepo.slugExists(body.slug);
    if (taken) throw ApiError.conflict(`Slug "${body.slug}" is already in use`);
  }

  /** @type {Record<string, unknown>} */
  const patch = { ...body };
  if (body.body_en !== undefined) {
    patch.reading_time_minutes = readingTime(body.body_en);
  }

  return articlesRepo.update(id, patch);
}

/**
 * @param {string} id
 */
async function publishArticle(id) {
  const existing = await getForAdmin(id);
  if (existing.status === "published") return existing;
  return articlesRepo.update(id, {
    status: "published",
    published_at: existing.published_at ?? new Date().toISOString(),
  });
}

/**
 * @param {string} id
 */
async function unpublishArticle(id) {
  const existing = await getForAdmin(id);
  if (existing.status === "draft") return existing;
  return articlesRepo.update(id, {
    status: "draft",
  });
}

module.exports = {
  listArticles,
  getArticleBySlug,
  listForAdmin,
  getForAdmin,
  createArticle,
  updateArticle,
  publishArticle,
  unpublishArticle,
  textToParagraphBlocks,
};
