const { creditFor, COST_PER_EVENT_HKD } = require("../../lib/donation-credit");
const { normalizeEmail } = require("../../lib/normalize");
// Imported as a module object rather than destructured, so `mock.method` in the tests
// replaces the property this file actually reads.
const campaignsRepo = require("../../data/campaigns.repo");
const donationsRepo = require("../../data/donations.repo");
const stripeEventsRepo = require("../../data/stripe-events.repo");
const donorsService = require("../donors.service");
const allocationService = require("./allocation.service");
const donorThankYouService = require("./donor-thank-you.service");

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

  // Metadata comes back as strings, and an empty tag would fail the CHECK constraint — so
  // split, then drop the blanks. upsertDonor sanitises again and only writes these when the
  // donor has never answered, which is what makes the question once-per-donor rather than
  // once-per-gift.
  const referralSources = String(session.metadata?.referral_sources ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const donor = await donorsService.upsertDonor({
    email,
    fullName: session.customer_details?.name ?? undefined,
    trackingOptIn: donation.tracking_opt_in ?? true,
    referralSources,
    referralSourceOther: session.metadata?.referral_source_other || undefined,
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

  // Credit the fundraiser this gift was earmarked for. Placed after the status flip so it
  // sits behind both idempotency gates: the event ledger in `handleEvent`, and the
  // already-succeeded early return above. A double credit raises no error and produces no
  // bad row — the total is simply wrong, which is why it is guarded twice.
  //
  // DEMO-ONLY: `addRaised` is a read-then-write, so two donations to the same campaign
  // landing together can lose one update — real version needs an atomic SQL increment
  // (`raised_hkd = raised_hkd + $1`, via an RPC or a migration). Harmless at demo volume,
  // wrong under real traffic (§19).
  let campaignOutcome = null;
  if (donation.campaign_id) {
    // Same try/catch reasoning as allocation and email below: anything thrown here becomes a
    // non-2xx, and Stripe then retries the whole handler forever.
    try {
      await campaignsRepo.addRaised(donation.campaign_id, donation.amount_hkd);
      campaignOutcome = {
        campaign_id: donation.campaign_id,
        credited_hkd: donation.amount_hkd,
      };
    } catch (campaignError) {
      console.error(
        `donation ${donation.id}: fundraiser credit failed — ${campaignError.message}`,
      );
      campaignOutcome = { campaign_id: donation.campaign_id, error: campaignError.message };
    }
  }

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
    console.error(
      `donation ${donation.id}: allocation failed — ${allocationError.message}`,
    );
    allocationOutcome = { error: allocationError.message };
  }

  // The thank-you carries the tracking link, which is the donor's ONLY durable route back to
  // their giving history — the token is shown once on the thanks page and §15 has no
  // lookup-by-email. Same try/catch reasoning as allocation above: Stripe retries anything
  // that is not a 200, so a mail failure must not escape. Logged rather than discarded,
  // because a thank-you that silently never sent is a donor who lost their history.
  let emailOutcome = null;
  try {
    emailOutcome = await donorThankYouService.sendDonorThankYou({
      donor: { ...donor, tracking_opt_in: donation.tracking_opt_in ?? true },
      donation: { ...donation, events_credited: eventsCredited },
      clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      // Empty when allocation failed above — the email then falls back to the count rather
      // than listing sessions that were never attached.
      sessions: allocationOutcome?.sessions ?? [],
    });
  } catch (emailError) {
    console.error(
      `donation ${donation.id}: thank-you email failed — ${emailError.message}`,
    );
    emailOutcome = { sent: false, error: emailError.message };
  }

  return {
    donation_id: donation.id,
    donor_id: donor.id,
    events_credited: eventsCredited,
    campaign: campaignOutcome,
    allocation: allocationOutcome,
    email: emailOutcome,
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
