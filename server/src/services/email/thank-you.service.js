const { ApiError } = require("../../lib/api-error");
const emailLib = require("../../lib/email");
const { renderThankYou } = require("../../lib/email-templates");

/**
 * Sends a post-attendance thank-you with rebook CTA.
 *
 * This used to carry its own private EMAIL_MODE switch: `live` threw, `console` logged, and
 * every other value silently returned a payload without sending anything. server/.env
 * carries EMAIL_MODE=smtp, which matched neither branch — so the one email a volunteer is
 * actually promised was rendered and dropped on the floor, while markAttendance counted it
 * as sent. Nothing failed, so nothing surfaced.
 *
 * Delivery now goes through lib/email, which owns the mode switch for the whole server:
 * `smtp` really sends, anything else renders to stdout, `send` stays reserved for Resend.
 * `demo_preview` is gone from the return — it was only ever true, and callers that want the
 * demo playback get it from log-mode's banner instead.
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

  const rendered = renderThankYou(volunteer, opportunity, signup, recommendations || []);

  // Deliberately not caught here. markAttendance stamps thank_you_email_sent_at only on
  // success and its caller logs and swallows, so a failure leaves the signup eligible for a
  // retry. Swallowing it at this level would mark it sent and lose the email for good.
  const result = await emailLib.sendEmail({
    to: volunteer.email,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });

  return {
    to: volunteer.email,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    mode: result.mode,
    delivered: result.delivered,
    recommendations: (recommendations || []).map((rec) => ({
      id: rec.id,
      starts_at: rec.starts_at,
    })),
  };
}

module.exports = { sendThankYou };
