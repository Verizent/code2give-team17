const crypto = require("node:crypto");
const donorsRepo = require("../data/donors.repo");
const { normalizeEmail } = require("../lib/normalize");

function newAccessToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Upserts a donor keyed on normalised email (CONTEXT.md §15).
 * A returning email resolves to the existing row and token — never split history.
 *
 * @param {{ email: string, fullName?: string, locale?: string, trackingOptIn?: boolean }} opts
 * @returns {Promise<{ id: string, email: string, access_token: string, full_name: string|null }>}
 */
async function upsertDonor({ email, fullName, locale = "en", trackingOptIn = true }) {
  const normalized = normalizeEmail(email);
  const existing = await donorsRepo.findByEmail(normalized);

  if (existing) {
    const updates = {};
    if (trackingOptIn && !existing.tracking_opt_in) updates.tracking_opt_in = true;
    if (fullName && !existing.full_name) updates.full_name = fullName;
    if (Object.keys(updates).length > 0) {
      await donorsRepo.updateDonor(existing.id, updates);
    }
    return existing;
  }

  return donorsRepo.createDonor({
    email: normalized,
    full_name: fullName ?? null,
    locale,
    access_token: newAccessToken(),
    tracking_opt_in: trackingOptIn,
  });
}

/**
 * @param {string} token
 * @returns {Promise<object|null>}
 */
async function findDonorByToken(token) {
  return donorsRepo.findByToken(token);
}

module.exports = { upsertDonor, findDonorByToken, newAccessToken };
