const crypto = require("node:crypto");
const { ApiError } = require("../../lib/api-error");
const mediaRepo = require("../../data/media.repo");

/**
 * Mirrors the bucket's own allow-list.
 *
 * SVG is absent deliberately: it is an image to a browser but a script host to an
 * attacker, and the bucket is public. Checking here as well as at the bucket means the
 * bytes never leave this process when the type is wrong.
 */
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

/** The bucket's configured ceiling. Rejecting first gives a clearer error than a 4xx from storage. */
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Stores a cover image and returns the URL to save on the article.
 *
 * @param {Buffer} body raw image bytes
 * @param {string} contentType
 * @returns {Promise<{ url: string }>}
 */
async function uploadCoverImage(body, contentType) {
  const extension = ALLOWED.get(String(contentType).split(";")[0].trim());

  if (!extension) {
    throw ApiError.badRequest(
      `Unsupported image type "${contentType}". Use JPEG, PNG or WebP.`,
    );
  }
  if (!body?.length) {
    throw ApiError.badRequest("Image is empty");
  }
  if (body.length > MAX_BYTES) {
    throw new ApiError(413, "Image is larger than 5 MB");
  }

  // Generated, never taken from a client-supplied filename — a caller-controlled path is
  // how you get traversal or a silently overwritten object. Random rather than a hash of
  // the bytes so re-uploading the same picture does not collide with itself.
  const path = `covers/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;

  const url = await mediaRepo.uploadPublicObject(path, body, contentType);
  return { url };
}

module.exports = { uploadCoverImage, ALLOWED, MAX_BYTES };
