const instagramRepo = require("../../data/instagram.repo");
const { ApiError } = require("../../lib/api-error");
const { parsePaging, buildMeta } = require("../../lib/pagination");
const { resolveLocale } = require("../../lib/locale");

const INSTAGRAM_URL_RE = /^https:\/\/(www\.)?instagram\.com\/p\/[^/]+\/?/;
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);

/**
 * Pull the post shortcode out of an Instagram permalink.
 *
 * Parsed with `new URL` and matched on host equality rather than a string prefix,
 * because a prefix test accepts `https://instagram.com.evil.com/p/…`. Tolerates a
 * missing trailing slash and the tracking parameters the share sheet appends, since
 * those are what an admin actually pastes.
 *
 * The shortcode is what builds the embed src, so resolving it here means the client
 * never parses a URL and a malformed row is dropped before it can render an iframe
 * pointed at nothing.
 *
 * Reels are not supported: the create validation has always been `/p/` only.
 *
 * @param {unknown} value
 * @returns {string | null}
 */
function extractShortcode(value) {
  if (typeof value !== "string" || value === "") return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !INSTAGRAM_HOSTS.has(url.hostname)) return null;

    const [prefix, shortcode] = url.pathname.split("/").filter(Boolean);
    return prefix === "p" && shortcode ? shortcode : null;
  } catch {
    return null;
  }
}

async function listEmbeds(query = {}) {
  const paging = parsePaging(query);
  const { rows, total } = await instagramRepo.listAll({ from: paging.from, to: paging.to });
  return { items: rows, meta: buildMeta(total, paging) };
}

/**
 * `GET /api/instagram` — active embeds for the public wall.
 *
 * Unlike the admin list, this resolves the bilingual caption and attaches the
 * shortcode: it is a visitor-facing response, so it follows the same locale contract
 * as every other public content route rather than leaking `_en` / `_zh`.
 *
 * @param {"en" | "zh-Hant"} [locale]
 * @returns {Promise<object[]>}
 */
async function listActiveEmbeds(locale) {
  const rows = await instagramRepo.listActive();

  return rows
    .map((row) => ({ ...resolveLocale(row, ["caption"], locale), shortcode: extractShortcode(row.url) }))
    .filter((row) => row.shortcode !== null);
}

async function createEmbed(body) {
  if (!INSTAGRAM_URL_RE.test(body.url)) {
    throw ApiError.badRequest("url must be a valid Instagram post URL (https://www.instagram.com/p/…)");
  }
  return instagramRepo.create(body);
}

async function updateEmbed(id, body) {
  if (body.url !== undefined && !INSTAGRAM_URL_RE.test(body.url)) {
    throw ApiError.badRequest("url must be a valid Instagram post URL");
  }
  const row = await instagramRepo.update(id, body);
  if (!row) throw ApiError.notFound(`No Instagram embed with id "${id}"`);
  return row;
}

async function deleteEmbed(id) {
  const row = await instagramRepo.remove(id);
  if (!row) throw ApiError.notFound(`No Instagram embed with id "${id}"`);
  return row;
}

module.exports = {
  listEmbeds,
  listActiveEmbeds,
  createEmbed,
  updateEmbed,
  deleteEmbed,
  extractShortcode,
};
