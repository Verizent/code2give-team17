const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

const BUCKET = "media";

/**
 * Uploads bytes to the public `media` bucket and returns their public URL.
 *
 * `upsert` stays false so a key collision surfaces as an error rather than silently
 * replacing an existing object — the keys are UUIDs, so a collision means a bug, not
 * a retry.
 *
 * @param {string} key - storage object key, generated server-side
 * @param {Buffer} buffer
 * @param {string} contentType - sniffed MIME type, never the caller's header
 * @returns {Promise<string>} public URL
 */
async function uploadPublicObject(key, buffer, contentType) {
  const storage = getSupabase().storage.from(BUCKET);

  const { error } = await storage.upload(key, buffer, { contentType, upsert: false });
  assertOk(error);

  const { data } = storage.getPublicUrl(key);
  return data.publicUrl;
}

module.exports = { uploadPublicObject, BUCKET };
