const crypto = require("node:crypto");
const { getSupabase } = require("../config/supabase");
const { normalizeEmail } = require("../lib/normalize");

function newAccessToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * A returning email resolves to the existing row and token — never split history.
 */
async function upsertDonor({ email, fullName, locale = "en", trackingOptIn = true }) {
  const normalized = normalizeEmail(email);
  const db = getSupabase();

  const { data: existing, error: lookupError } = await db
    .from("donors")
    .select("id, email, access_token, full_name")
    .eq("email", normalized)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existing) {
    const updates = {};
    if (trackingOptIn) updates.tracking_opt_in = true;
    if (fullName && !existing.full_name) updates.full_name = fullName;

    if (Object.keys(updates).length > 0) {
      await db.from("donors").update(updates).eq("id", existing.id);
    }

    return existing;
  }

  const { data: created, error: insertError } = await db
    .from("donors")
    .insert({
      email: normalized,
      full_name: fullName || null,
      locale,
      access_token: newAccessToken(),
      tracking_opt_in: trackingOptIn,
    })
    .select("id, email, access_token")
    .single();

  if (insertError) {
    throw insertError;
  }

  return created;
}

module.exports = { upsertDonor, newAccessToken };
