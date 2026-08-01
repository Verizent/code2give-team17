/**
 * Email sender wrapper (PLAN.md §Phase D).
 *
 * DEMO-ONLY behaviour: `EMAIL_MODE=log` (default) renders every send to stdout.
 * `EMAIL_MODE=send` would call Resend, but Resend's sandbox only delivers to
 * verified addresses until love21foundation.com DNS is verified (§17), so
 * defaulting to log-mode keeps the demo path working without hidden failures.
 */

const MODE = () => (process.env.EMAIL_MODE || "log").toLowerCase();

/**
 * @param {{ to: string, subject: string, text: string, html?: string }} message
 * @returns {Promise<{ mode: 'log'|'send', delivered: boolean, id?: string }>}
 */
async function sendEmail(message) {
  if (MODE() === "send") {
    // Real Resend call would live here. Not wired — DNS blocker per §17.
    // Fail-visible so nobody thinks a real send happened.
    throw new Error("EMAIL_MODE=send not implemented — verify love21foundation.com DNS first");
  }

  // Log-mode: render to stdout in a format that's obvious in the terminal.
  const banner = "─".repeat(60);
  console.log(
    `\n${banner}\n[EMAIL · log-mode]\n` +
    `To:      ${message.to}\n` +
    `Subject: ${message.subject}\n\n` +
    `${message.text}\n${banner}\n`,
  );
  return { mode: "log", delivered: true };
}

module.exports = { sendEmail };
