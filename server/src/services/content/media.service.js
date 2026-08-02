const { randomUUID } = require("node:crypto");
const mediaRepo = require("../../data/media.repo");
const { ApiError } = require("../../lib/api-error");

/** Mirrors the `file_size_limit` set on the bucket, so the two cannot drift apart. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Identify an image from its leading bytes.
 *
 * The filename and the `Content-Type` header both come from the caller, so neither can
 * decide what a file is. SVG is absent from this list on purpose: it can carry
 * `<script>`, and the bucket is public, so accepting one would serve stored XSS from
 * the bucket origin. Returning null is the reject signal.
 *
 * @param {Buffer} buffer
 * @returns {'image/jpeg' | 'image/png' | 'image/webp' | null}
 */
function detectImageType(buffer) {
  // Each signature is checked against its own length: a blanket minimum would reject a
  // valid short JPEG for being shorter than the WebP header it is not.
  if (!Buffer.isBuffer(buffer)) return null;

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // RIFF is a container: .wav is RIFF too. Only the WEBP fourcc at offset 8 decides.
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Build the storage object key. Entirely server-generated: a caller-supplied name on a
 * public bucket shared with article cover images would allow overwriting them.
 *
 * @param {string} contentType - a key of EXTENSIONS
 * @returns {string}
 */
function buildObjectKey(contentType) {
  return `community/${randomUUID()}.${EXTENSIONS[contentType]}`;
}

/**
 * Validate and store a community photo.
 *
 * Both rejections happen before the repo is touched, so a bad payload never reaches
 * storage and never leaves an orphaned object behind.
 *
 * @param {Buffer} buffer - raw request body
 * @returns {Promise<string>} public URL of the stored image
 */
async function uploadCommunityPhoto(buffer) {
  if (Buffer.isBuffer(buffer) && buffer.length > MAX_UPLOAD_BYTES) {
    throw ApiError.badRequest("Image is larger than the 5MB limit.");
  }

  const contentType = detectImageType(buffer);
  if (!contentType) {
    throw ApiError.badRequest("Only JPEG, PNG and WebP images are accepted.");
  }

  return mediaRepo.uploadPublicObject(buildObjectKey(contentType), buffer, contentType);
}

module.exports = { detectImageType, buildObjectKey, uploadCommunityPhoto, MAX_UPLOAD_BYTES };
