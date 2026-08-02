// DEMO-ONLY: Stripe runs in **test mode** against the sandbox — test keys, test cards, no real
// money. Real version needs live keys and the §19 pre-production checklist (CONTEXT.md §17, §18.6).
// The code below is the real integration: real hosted Checkout, real webhook signatures. Only
// the keys are test-mode, so going live is a credentials change, not a refactor.

const Stripe = require("stripe");

const { ApiError } = require("./api-error");

let client;

/**
 * The Stripe client.
 *
 * Read lazily, never at import. CLAUDE.md: a missing secret must not stop a teammate's server
 * from starting when they pull — the same reason `SERVER_SECRET` throws at hash time rather
 * than at boot.
 *
 * @returns {import("stripe").Stripe}
 */
function getStripe() {
  if (client) {
    return client;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new ApiError(500, "STRIPE_SECRET_KEY is not set — see server/.env.example");
  }

  // A live key here would move real money on a hackathon build. CONTEXT.md §18.6 makes this
  // a hard rule, so it is enforced rather than documented.
  if (!secretKey.startsWith("sk_test_")) {
    throw new ApiError(
      500,
      "STRIPE_SECRET_KEY must be a test key (sk_test_…). Live keys are forbidden on this build.",
    );
  }

  client = new Stripe(secretKey);
  return client;
}

/**
 * Verifies a webhook signature and returns the parsed event.
 *
 * Throws `400` on every failure, never 500: a 500 tells Stripe to retry a payload that will
 * never verify, so a bad signature would be redelivered for days.
 *
 * @param {Buffer} rawBody The **unparsed** body. CONTEXT.md §17: `express.raw()` must be
 *   mounted above `express.json()` or verification fails on a valid signature.
 * @param {string} signature Value of the `Stripe-Signature` header.
 * @returns {import("stripe").Stripe.Event}
 */
function constructEvent(rawBody, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new ApiError(
      500,
      "STRIPE_WEBHOOK_SECRET is not set — run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and copy the whsec_… value into server/.env",
    );
  }

  if (!signature) {
    throw ApiError.badRequest("Missing Stripe-Signature header");
  }

  try {
    return getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    throw ApiError.badRequest(`Stripe signature verification failed: ${error.message}`);
  }
}

module.exports = { getStripe, constructEvent };
