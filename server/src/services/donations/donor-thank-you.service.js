// Imported as module objects, not destructured, so `mock.method` stubs in tests replace the
// property the caller actually reads (same reason as checkout.service.js).
const emailLib = require("../../lib/email");
const templates = require("../../lib/email-templates");

/**
 * The post-payment thank-you email for a donor.
 *
 * This exists because the tracking token is shown exactly once — on the thanks page, right
 * after payment — and there is deliberately no way to look it up again. A recovery endpoint
 * taking an email address would answer "did this named person donate to a disability charity"
 * for anyone who submitted the form, so §15 does not have one. The email therefore *is* the
 * recovery mechanism: the donor's inbox is where the credential lives, which is durable,
 * cross-device, private, and searchable in a way localStorage is not.
 *
 * Called from the Stripe webhook. Two rules follow from that:
 *
 *  1. **It must never throw into the webhook.** Stripe retries anything that is not a 200, so
 *     an exception escaping here during a mail outage produces a retry storm that re-runs the
 *     whole handler. The caller wraps this, and this returns an outcome rather than throwing.
 *  2. **Failure must be logged, not swallowed.** A thank-you that silently never sent is a
 *     donor who silently lost their giving history.
 */

/** The donor opted out of tracking, so there is no token and no link — but still a receipt. */
function trackingUrlFor(donor, clientOrigin) {
  if (!donor?.access_token) return null;
  return `${clientOrigin}/give/track/${donor.access_token}`;
}

/**
 * @param {{ donor: { email: string, full_name?: string|null, locale?: string,
 *                    access_token?: string|null, tracking_opt_in?: boolean },
 *          donation: { amount_hkd: number, frequency: string, events_credited: number },
 *          clientOrigin: string }} args
 * @returns {Promise<{ sent: boolean, reason?: string, to?: string, tracked?: boolean }>}
 */
async function sendDonorThankYou({ donor, donation, clientOrigin, sessions = [] }) {
  if (!donor?.email) {
    return { sent: false, reason: "donor has no email address" };
  }

  // Gated the same way `getCheckoutStatus` gates the token: opting out of tracking means the
  // link is withheld, not that the receipt is. Reading `tracking_opt_in` off the donation
  // rather than the donor row keeps this consistent with what the donor chose at checkout.
  const trackingUrl =
    donor.tracking_opt_in === false ? null : trackingUrlFor(donor, clientOrigin);

  // `sessions` are the rows allocation already fetched — the actual classes this gift funded,
  // named in the email rather than counted. Empty when allocation found nothing eligible, in
  // which case the template falls back to the count.
  const rendered = templates.renderDonorThankYou(donor, donation, trackingUrl, sessions);

  await emailLib.sendEmail({
    to: donor.email,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });

  return {
    sent: true,
    to: donor.email,
    tracked: Boolean(trackingUrl),
    sessions_listed: sessions.length,
  };
}

module.exports = { sendDonorThankYou, trackingUrlFor };
