const instagramRepo = require("../../data/instagram.repo");
const { ApiError } = require("../../lib/api-error");
const { parsePaging, buildMeta } = require("../../lib/pagination");

const INSTAGRAM_URL_RE = /^https:\/\/(www\.)?instagram\.com\/p\/[^/]+\/?/;

async function listEmbeds(query = {}) {
  const paging = parsePaging(query);
  const { rows, total } = await instagramRepo.listAll({ from: paging.from, to: paging.to });
  return { items: rows, meta: buildMeta(total, paging) };
}

async function listActiveEmbeds() {
  return instagramRepo.listActive();
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

module.exports = { listEmbeds, listActiveEmbeds, createEmbed, updateEmbed, deleteEmbed };
