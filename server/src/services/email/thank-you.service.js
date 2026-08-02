// DEMO-ONLY: EMAIL_MODE=console logs a rendered preview and returns the payload
// so the demo can play back the email without an inbox. EMAIL_MODE=live throws
// — real send needs Resend credentials and a verified sender domain (§17).
// Real version needs: npm i resend, RESEND_API_KEY, a domain verified with Resend.

const { ApiError } = require("../../lib/api-error");
const { renderThankYou } = require("../../lib/email-templates");

/**
 * Sends a post-attendance thank-you with rebook CTA — or, in console mode,
 * renders and returns the payload without leaving the server.
 *
 * @param {{
 *   volunteer: { email?: string|null, full_name: string, locale?: string },
 *   signup:    { hours_logged: number },
 *   opportunity: { title_en: string, title_zh?: string|null, programme: string },
 *   recommendations: Array<{ id: string, title_en: string, title_zh?: string|null, starts_at: string }>,
 * }} args
 */
async function sendThankYou({ volunteer, signup, opportunity, recommendations }) {
  if (!volunteer?.email) {
    throw ApiError.badRequest("Cannot send thank-you: volunteer has no email address");
  }

  const mode = process.env.EMAIL_MODE || "console";

  if (mode === "live") {
    throw ApiError.badRequest(
      "EMAIL_MODE=live is not implemented — real send needs Resend credentials",
    );
  }

  const rendered = renderThankYou(
    volunteer,
    opportunity,
    signup,
    recommendations || [],
  );

  const payload = {
    demo_preview: true,
    to: volunteer.email,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    recommendations: (recommendations || []).map((rec) => ({
      id: rec.id,
      starts_at: rec.starts_at,
    })),
  };

  if (mode === "console") {
    // Judge-visible playback: the server log carries the whole email.
    console.log(
      `\n=== DEMO-ONLY thank-you email (EMAIL_MODE=console) ===\n` +
        `To: ${payload.to}\nSubject: ${payload.subject}\n\n${payload.text}\n` +
        `=== end preview ===\n`,
    );
  }

  return payload;
}

module.exports = { sendThankYou };
