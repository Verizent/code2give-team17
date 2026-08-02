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
 * SMTP transport, cached against the config that produced it.
 *
 * Built lazily rather than at import time: `require("../lib/email")` happens in modules that
 * never send — the volunteer track imports it for `normaliseEmail` alone — and constructing a
 * transport at import would make every one of them fail on a missing SMTP_HOST.
 *
 * Cached **by config, not simply once**. A plain `if (!transport)` would pin the first
 * settings it ever saw, so correcting a typo'd SMTP_HOST in `.env` would appear to change
 * nothing until the process restarted, and the connection pool is worth keeping otherwise.
 *
 * @type {{ key: string, value: import("nodemailer").Transporter } | null}
 */
let transport = null;

/**
 * Reads SMTP settings from the environment and fails loudly on anything missing.
 *
 * Credentials live in `server/.env` and never in the repo. `SMTP_PASS` for Gmail must be an
 * **app password**, not the account password — Google has refused plain passwords for SMTP
 * since 2022, and the resulting error says only "Username and Password not accepted".
 */
function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const missing = [
    !host && "SMTP_HOST",
    !user && "SMTP_USER",
    !pass && "SMTP_PASS",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `EMAIL_MODE=smtp needs ${missing.join(", ")} in server/.env. ` +
        `Set EMAIL_MODE=log to preview emails in the server log instead.`,
    );
  }

  const port = Number(process.env.SMTP_PORT || 587);
  return {
    host,
    port,
    // 465 is implicit TLS; 587 starts plaintext and upgrades via STARTTLS. Getting this
    // backwards produces a connection that hangs rather than a clear error.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user, pass },
  };
}

function getTransport(config = smtpConfig()) {
  const key = JSON.stringify(config);
  if (!transport || transport.key !== key) {
    // Required here rather than at module scope so the dependency is only loaded by processes
    // that actually send.
    transport = { key, value: require("nodemailer").createTransport(config) };
  }
  return transport.value;
}

/**
 * Verifies the SMTP connection and credentials without sending anything.
 * Used by `npm run email:check` so a misconfiguration surfaces before a donor is owed an email.
 *
 * @returns {Promise<{ ok: true, host: string, port: number, user: string }>}
 */
async function verifyTransport() {
  const config = smtpConfig();
  await getTransport(config).verify();
  return { ok: true, host: config.host, port: config.port, user: config.auth.user };
}

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
  const mode = MODE();

  if (mode === "smtp") {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const info = await getTransport().sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    });
    // Logged because a donor's tracking link travels in these, and "did it actually go out"
    // is the first question when someone says they never received it.
    console.log(`[EMAIL · smtp] ${message.to} — ${message.subject} — id ${info.messageId}`);
    return { mode: "smtp", delivered: true, id: info.messageId };
  }

  if (mode === "send") {
    // Kept as a guard rather than silently aliased to smtp: `send` was the Resend path, and a
    // config still asking for it should be corrected rather than quietly redirected.
    throw new Error(
      "EMAIL_MODE=send was the unbuilt Resend path — use EMAIL_MODE=smtp (see .env.example)",
    );
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

module.exports = { normaliseEmail, sendEmail, verifyTransport };
