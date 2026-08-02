const { randomUUID } = require("node:crypto");
const { ApiError } = require("../../lib/api-error");
const mediaRepo = require("../../data/media.repo");
const { detectImageType, MAX_UPLOAD_BYTES } = require("../content/media.service");

/**
 * Extension per sniffed type. SVG is deliberately absent — it is an image to a browser
 * but a script host to an attacker, and the bucket is public.
 */
const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Stores an article cover image and returns the URL to save on the article.
 *
 * The `Content-Type` header is deliberately not a parameter: it comes from the caller,
 * so it cannot be what decides the file's type. `detectImageType` reads the magic bytes
 * instead — shared with the community-photo endpoint so the two cannot drift apart.
 *
 * `covers/` keeps these separate from `community/` in the same public bucket.
 *
 * @param {Buffer} buffer raw image bytes
 * @returns {Promise<{ url: string }>}
 */
async function uploadCoverImage(buffer) {
  if (Buffer.isBuffer(buffer) && buffer.length > MAX_UPLOAD_BYTES) {
    throw new ApiError(413, "Image is larger than the 5MB limit.");
  }

  const contentType = detectImageType(buffer);
  if (!contentType) {
    throw ApiError.badRequest("Only JPEG, PNG and WebP images are accepted.");
  }

  // Generated, never from a client-supplied filename: a caller-controlled key is how you
  // get traversal, or one admin's cover silently overwriting another's.
  const key = `covers/${randomUUID()}.${EXTENSIONS[contentType]}`;

  const url = await mediaRepo.uploadPublicObject(key, buffer, contentType);
  return { url };
}

module.exports = { uploadCoverImage, EXTENSIONS, MAX_UPLOAD_BYTES };
