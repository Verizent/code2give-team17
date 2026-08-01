/**
 * Normalises an email address to the form the database stores.
 *
 * `volunteers.email` and `volunteer_email_verifications.email` both carry
 * `check (email = lower(btrim(email)))`, and `donors` keys on the same rule (§15).
 * Every write and every lookup must pass through here or the two silently disagree.
 *
 * The asymmetry that makes this worth a module: an un-normalised **write** throws
 * loudly against the check constraint, but an un-normalised **lookup** simply finds
 * no row — indistinguishable from "no such volunteer". That is the silent-and-
 * expensive failure §26 says to spend test budget on.
 *
 * Postgres `btrim` strips spaces only; JS `trim()` also strips tabs and newlines.
 * Trimming more than the constraint requires is safe for writes (the stored value
 * still satisfies the check) and only diverges for an address whose leading
 * character is a tab, which cannot arrive from Supabase Auth.
 *
 * @param {string} value
 * @returns {string} lowercased, trimmed
 * @throws {TypeError} on a non-string, or on an empty/whitespace-only address
 */
function normaliseEmail(value) {
  if (typeof value !== "string") {
    throw new TypeError(`normaliseEmail expected a string, received ${typeof value}`);
  }

  const normalised = value.trim().toLowerCase();

  if (normalised === "") {
    throw new TypeError("normaliseEmail received an empty address");
  }

  return normalised;
}

module.exports = { normaliseEmail };
