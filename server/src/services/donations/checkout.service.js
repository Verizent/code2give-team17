const { ApiError } = require("../../lib/api-error");
// Imported as a module object rather than destructured: `mock.method` replaces the property,
// and a destructured reference captured at import time would never see the stub.
const stripeLib = require("../../lib/stripe");
const donationsRepo = require("../../data/donations.repo");

/**
 * Creates a Stripe Checkout Session and the `pending` donation it points at.
 *
 * The donate form carries **amount, frequency, and nothing else** (CONTEXT.md §15): no email,
 * no name — Stripe Checkout captures those natively and the webhook reads them back — and no
 * programme, because donors do not choose a designation (PLAN.md §3).
 */

/** Stripe's minimum charge in HKD, below which the API rejects the session outright. */
const MIN_AMOUNT_HKD = 4;

/**
 * Ceiling on a single online gift, matching `recordDonationSchema`.
 *
 * Stripe caps `unit_amount` at 999,999,999,999 cents, so without a bound of our own the ×100
 * in `toCents` pushed an over-large amount past it and the SDK threw *after* validation —
 * surfacing as a 500 with a raw Stripe message instead of a 400 the form could show. Anything
 * above this is a conversation with the foundation, not a checkout session.
 */
const MAX_AMOUNT_HKD = 1_000_000;

/** Hosted Checkout only. Never Stripe Elements — that changes our PCI position (CONTEXT.md §17). */
const PAYMENT_METHODS = ["card"];

/**
 * Our `frequency` → Stripe's `recurring.interval`. Absent from this map means a one-off
 * payment, not an unsupported value — the schema is what rejects unknown frequencies.
 *
 * Stripe accepts `day | week | month | year`; only the two the donate form offers are wired.
 */
const RECURRING_INTERVALS = { weekly: "week", monthly: "month" };

/** Card-statement product name per frequency. Keep in step with RECURRING_INTERVALS. */
const PRODUCT_NAMES = {
  weekly: "Weekly gift to Love 21",
  monthly: "Monthly gift to Love 21",
};

/**
 * Integer dollars → cents.
 *
 * **The only place this multiplication happens.** CONTEXT.md §29 makes `amount_hkd` integer
 * dollars across the whole API and keeps the ×100 server-side, because converting in both
 * directions cancels out in testing and only surfaces as a 100× error in front of an audience.
 *
 * @param {number} amountHkd
 * @returns {number}
 */
function toCents(amountHkd) {
  return amountHkd * 100;
}

/**
 * @param {{ amount_hkd: number, frequency?: string, campaign_id?: string|null,
 *   tracking_opt_in?: boolean }} input
 * @param {{ appBaseUrl: string, clientOrigin: string }} urls
 * @returns {Promise<{ checkout_url: string, session_id: string, donation_id: string }>}
 */
async function createCheckoutSession(input, { clientOrigin }) {
  const amountHkd = Number(input.amount_hkd);
  if (!Number.isInteger(amountHkd) || amountHkd < MIN_AMOUNT_HKD) {
    throw ApiError.badRequest(`amount_hkd must be a whole number of at least ${MIN_AMOUNT_HKD}`);
  }
  if (amountHkd > MAX_AMOUNT_HKD) {
    throw ApiError.badRequest(`amount_hkd must be at most ${MAX_AMOUNT_HKD}`);
  }

  const frequency = input.frequency ?? "once";
  const interval = RECURRING_INTERVALS[frequency];
  const isRecurring = Boolean(interval);
  const trackingOptIn = input.tracking_opt_in ?? true;

  const stripe = stripeLib.getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: isRecurring ? "subscription" : "payment",
    payment_method_types: PAYMENT_METHODS,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "hkd",
          unit_amount: toCents(amountHkd),
          ...(isRecurring ? { recurring: { interval } } : {}),
          product_data: {
            name: PRODUCT_NAMES[frequency] ?? "Gift to Love 21",
            // Never "your gift pays for N sessions" — the §15 copy rule forbids exclusive
            // attribution, and this string appears on the donor's card statement page.
            description: "Your gift helps make Love 21 sessions possible.",
          },
        },
      },
    ],
    // Stripe collects the email natively; the webhook reads it back off the session. This is
    // why our own form has no email field at all.
    customer_creation: isRecurring ? undefined : "always",
    // These must match routes the client actually serves (client/src/App.jsx). They
    // previously pointed at `/donate`, which the router does not define — it falls through
    // to the `*` catch-all and redirects to `/`, so a donor who paid landed on the homepage
    // with no confirmation. Nothing failed loudly, because Stripe considers any 200 a
    // successful return. Change these only alongside the routes themselves.
    success_url: `${clientOrigin}/give/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientOrigin}/give?cancelled=1`,
    // Stripe caps a metadata value at 500 characters. The sources are a short comma-joined
    // list of known tags so they cannot approach that; the free text is clamped to 200 by
    // the schema. Carrying them here rather than storing them on the donation is deliberate:
    // the answer belongs to the donor, and the donor row does not exist until the webhook
    // reads back the email Stripe collected.
    metadata: {
      amount_hkd: String(amountHkd),
      tracking_opt_in: String(trackingOptIn),
      campaign_id: input.campaign_id ?? "",
      referral_sources: (input.referral_sources ?? []).join(","),
      referral_source_other: input.referral_source_other ?? "",
    },
  });

  const donation = await donationsRepo.insertPendingDonation({
    amount_hkd: amountHkd,
    frequency,
    campaign_id: input.campaign_id ?? null,
    stripe_session_id: session.id,
    tracking_opt_in: trackingOptIn,
  });

  return {
    checkout_url: session.url,
    session_id: session.id,
    donation_id: donation.id,
  };
}

module.exports = { createCheckoutSession, toCents, MIN_AMOUNT_HKD, MAX_AMOUNT_HKD };
