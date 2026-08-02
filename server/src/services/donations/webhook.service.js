const { creditFor, COST_PER_EVENT_HKD } = require("../../lib/donation-credit");
const { normalizeEmail } = require("../../lib/normalize");
const donationsRepo = require("../../data/donations.repo");
const stripeEventsRepo = require("../../data/stripe-events.repo");
const donorsService = require("../donors.service");
const allocationService = require("./allocation.service");

/**
 * Stripe webhook handling (CONTEXT.md §15, §17).
 *
 * Every handler is idempotent, because Stripe retries deliveries on a timeout, a non-2xx, or a
 * network blip. The route always answers `200` once an event is recorded — including on a
 * duplicate — so a retry loop cannot form.
 */

const HANDLED_TYPES = new Set([
  "checkout.session.completed",
  "payment_intent.payment_failed",
  "invoice.paid",
  "customer.subscription.deleted",
]);

/**
 * Pulls the payer's email off a Checkout Session. Stripe populates one of these depending on
 * whether a Customer was created, so both are checked rather than assuming the shape.
 *
 * @param {object} session
 * @returns {string|null}
 */
function emailFromSession(session) {
  const raw =
    session.customer_details?.email ??
    session.customer_email ??
    null;

  return raw ? normalizeEmail(raw) : null;
}

/**
 * `checkout.session.completed` — the payment succeeded.
 *
 * Order matters and is the point of this function:
 *  1. the event is already recorded by `handleEvent` before we get here
 *  2. normalise email → upsert donor (a returning supporter resolves to their existing
 *     record and token, so history never splits — CONTEXT.md §15)
 *  3. attach the donor, snapshot the credit, flip to `succeeded`
 *  4. email is queued *outside* this path, so a mail failure cannot un-succeed a paid donation
 *
 * @param {object} session
 */
async function handleCheckoutCompleted(session) {
  const donation = await donationsRepo.findByStripeSession(session.id);

  // No matching row means a session we did not create — another project sharing the test
  // account, or a replayed fixture. Ignore it rather than inventing a donation.
  if (!donation) {
    return { ignored: true, reason: "no donation for session" };
  }

  if (donation.status === "succeeded") {
    return { ignored: true, reason: "already succeeded" };
  }

  const email = emailFromSession(session);
  if (!email) {
    // Stripe always collects an email on hosted Checkout, so this means a shape we did not
    // expect. Fail loudly rather than writing a donor-less succeeded donation.
    throw new Error(`checkout.session.completed carried no email (session ${session.id})`);
  }

  const donor = await donorsService.upsertDonor({
    email,
    fullName: session.customer_details?.name ?? undefined,
    trackingOptIn: donation.tracking_opt_in ?? true,
  });

  const eventsCredited = creditFor(donation.amount_hkd);

  await donationsRepo.updateDonation(donation.id, {
    donor_id: donor.id,
    stripe_payment_intent:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    events_credited: eventsCredited,
    cost_per_event_at_donation: COST_PER_EVENT_HKD,
    status: "succeeded",
  });

  // Attach to real sessions (§15). Runs synchronously in the webhook path so a demo-day
  // walk sees allocations by the time the thanks page loads — a background job would be
  // nicer under load but this is small work and blocks nothing else Stripe cares about.
  // Wrapped in its own try/catch: a query error here must not stop us from returning
  // 200 to Stripe, or we get a retry loop that never converges.
  let allocationOutcome = null;
  try {
    allocationOutcome = await allocationService.allocateForDonation({
      ...donation,
      donor_id: donor.id,
      events_credited: eventsCredited,
      cost_per_event_at_donation: COST_PER_EVENT_HKD,
      tracking_opt_in: donation.tracking_opt_in ?? true,
      created_at: donation.created_at ?? new Date().toISOString(),
    });
  } catch (allocationError) {
    // The pending-retry job (§16) will pick this up next tick.
    allocationOutcome = { error: allocationError.message };
  }

  return {
    donation_id: donation.id,
    donor_id: donor.id,
    events_credited: eventsCredited,
    allocation: allocationOutcome,
  };
}

/**
 * `payment_intent.payment_failed` — mark the donation failed so it never reaches a lifetime
 * total. CONTEXT.md §15: failed and refunded charges must not inflate "total given".
 *
 * @param {object} paymentIntent
 */
async function handlePaymentFailed(paymentIntent) {
  const sessionId = paymentIntent.metadata?.checkout_session_id;
  if (!sessionId) {
    return { ignored: true, reason: "no session reference on payment_intent" };
  }

  const donation = await donationsRepo.findByStripeSession(sessionId);
  if (!donation || donation.status === "succeeded") {
    return { ignored: true, reason: "no pending donation to fail" };
  }

  await donationsRepo.updateDonation(donation.id, { status: "failed" });
  return { donation_id: donation.id, status: "failed" };
}

/**
 * Verifies-then-dispatches. The event is recorded **before** any handler runs, so a duplicate
 * delivery short-circuits without touching donors, donations or email.
 *
 * @param {import("stripe").Stripe.Event} event
 * @returns {Promise<{ handled: boolean, duplicate?: boolean, result?: object }>}
 */
async function handleEvent(event) {
  const isNew = await stripeEventsRepo.recordOnce({ id: event.id, type: event.type });
  if (!isNew) {
    return { handled: true, duplicate: true };
  }

  if (!HANDLED_TYPES.has(event.type)) {
    return { handled: false };
  }

  const object = event.data?.object ?? {};

  switch (event.type) {
    case "checkout.session.completed":
      return { handled: true, result: await handleCheckoutCompleted(object) };
    case "payment_intent.payment_failed":
      return { handled: true, result: await handlePaymentFailed(object) };
    // Recurring lifecycle beyond recording the event is cut for the demo (PLAN.md §6). The
    // events are still ledgered above, so nothing is silently lost.
    case "invoice.paid":
    case "customer.subscription.deleted":
      return { handled: true, result: { recorded: true } };
    default:
      return { handled: false };
  }
}

module.exports = {
  handleEvent,
  handleCheckoutCompleted,
  handlePaymentFailed,
  emailFromSession,
  HANDLED_TYPES,
};
