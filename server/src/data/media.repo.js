const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

/** Pre-existing public bucket: 5 MB cap, image/jpeg|png|webp only. */
const BUCKET = "media";

/**
 * Stores an object and returns its public URL.
 *
 * `upsert: false` on purpose — paths are generated per upload, so a collision means two
 * callers raced to the same name and silently overwriting one of them would lose it.
 *
 * @param {string} path
 * @param {Buffer} body
 * @param {string} contentType
 * @returns {Promise<string>}
 */
async function uploadPublicObject(path, body, contentType) {
  const supabase = getSupabase();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType, upsert: false });

  assertOk(error);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

module.exports = { uploadPublicObject, BUCKET };
