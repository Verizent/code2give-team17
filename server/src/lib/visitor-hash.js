const { createHash, createHmac } = require("node:crypto");

const utcDay = (date = new Date()) => date.toISOString().slice(0, 10);

/**
 * Derives the day's salt from SERVER_SECRET and the UTC date.
 *
 * Deriving rather than storing means there is no rotation job and no salt table:
 * the value is deterministic within a day and unrecoverable across days by
 * construction (CONTEXT.md §23).
 *
 * Throws lazily rather than at boot — a missing secret must not stop a teammate's
 * server from starting when they pull (plan, shared surfaces #4).
 */
function dailySalt(day) {
  const secret = process.env.SERVER_SECRET;

  if (!secret) {
    throw new Error(
      "SERVER_SECRET is not set — required to hash visitors. Add it to server/.env.",
    );
  }

  return createHmac("sha256", secret).update(day).digest("hex");
}

/**
 * Hashes a visitor for one UTC day.
 *
 * The raw IP is hashed and discarded inside the same request — never stored, never
 * logged. No cookie and no client storage, which is the entire reason no consent
 * banner is required.
 *
 * @param {string} ip
 * @param {string} userAgent
 * @param {string} [day] UTC date as `YYYY-MM-DD`; defaults to today
 * @returns {string} 64-character hex digest
 */
function visitorHash(ip, userAgent, day = utcDay()) {
  return createHash("sha256")
    .update(`${ip}|${userAgent}|${dailySalt(day)}`)
    .digest("hex");
}

module.exports = { visitorHash };
