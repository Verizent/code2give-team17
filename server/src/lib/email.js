const nodemailer = require("nodemailer");

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
 * Built once and reused: nodemailer pools connections per transport, and rebuilding one
 * per send means a fresh TCP + TLS + AUTH handshake every time.
 */
let transport = null;

/** Test seam — drops the memoised transport so env changes take effect. */
function __resetTransport() {
  transport = null;
}

function getTransport() {
  if (transport) {
    return transport;
  }

  const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // Loudly, not quietly. Falling back to log-mode here is precisely the bug this
    // function exists to remove: an app that reports delivered on mail it never sent.
    throw new Error(
      `EMAIL_MODE=smtp requires ${missing.join(", ")} — set them in server/.env or use EMAIL_MODE=log`,
    );
  }

  const port = Number(process.env.SMTP_PORT) || 587;

  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 and 25 start plaintext and upgrade via STARTTLS.
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  return transport;
}

/**
 * Email sender wrapper (PLAN.md §Phase D).
 *
 * Modes:
 *   `smtp` — real delivery through the SMTP_* credentials in server/.env. Throws if
 *            they are incomplete or the server rejects the message.
 *   `send` — reserved for Resend. Still throws: its sandbox only delivers to verified
 *            addresses until love21foundation.com DNS is verified (§17).
 *   anything else, including unset — renders to stdout. `log` (donations default) and
 *            `console` (the volunteer track's `.env.example` value) both land here.
 *
 * `smtp` used to fall into that last bucket, because the switch only special-cased
 * `send`. server/.env carries EMAIL_MODE=smtp and a full set of SMTP_* credentials, so
 * every email the app sent was quietly printed to a terminal and reported
 * `delivered: true` — including the attendance thank-you, the one email a volunteer is
 * actually promised. Nothing failed, so nothing surfaced.
 *
 * @param {{ to: string, subject: string, text: string, html?: string }} message
 * @returns {Promise<{ mode: 'log'|'smtp', delivered: boolean, id?: string }>}
 */
async function sendEmail(message) {
  if (MODE() === "send") {
    // Real Resend call would live here. Not wired — DNS blocker per §17.
    throw new Error("EMAIL_MODE=send not implemented — verify love21foundation.com DNS first");
  }

  if (MODE() === "smtp") {
    const info = await getTransport().sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    });

    return { mode: "smtp", delivered: true, id: info.messageId };
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

module.exports = { normaliseEmail, sendEmail, __resetTransport };
