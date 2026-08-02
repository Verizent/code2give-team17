/**
 * Email utilities. Two unrelated concerns share this module because both branches
 * independently created `lib/email.js` — the volunteer/auth track for address
 * normalisation, the donations track for sending. Kept together rather than split
 * because every caller of one is one `require` away from wanting the other, and the
 * merge that surfaced the collision is not the place to relocate live call sites.
 */

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

const MODE = () => (process.env.EMAIL_MODE || "log").toLowerCase();

/**
 * Email sender wrapper (PLAN.md §Phase D).
 *
 * DEMO-ONLY behaviour: anything other than `EMAIL_MODE=send` renders to stdout, so
 * both `log` (donations default) and `console` (the volunteer track's `.env.example`
 * value) land in log-mode. `EMAIL_MODE=send` would call Resend, but its sandbox only
 * delivers to verified addresses until love21foundation.com DNS is verified (§17), so
 * defaulting to log-mode keeps the demo path working without hidden failures — and
 * `send` throws rather than silently no-ops, so nobody believes a real send happened.
 *
 * @param {{ to: string, subject: string, text: string, html?: string }} message
 * @returns {Promise<{ mode: 'log'|'send', delivered: boolean, id?: string }>}
 */
async function sendEmail(message) {
  if (MODE() === "send") {
    // Real Resend call would live here. Not wired — DNS blocker per §17.
    throw new Error("EMAIL_MODE=send not implemented — verify love21foundation.com DNS first");
  }

  const banner = "─".repeat(60);
  console.log(
    `\n${banner}\n[EMAIL · log-mode]\n` +
      `To:      ${message.to}\n` +
      `Subject: ${message.subject}\n\n` +
      `${message.text}\n${banner}\n`,
  );
  return { mode: "log", delivered: true };
}

module.exports = { normaliseEmail, sendEmail };
