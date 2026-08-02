const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const donationsRepo = require("../../../src/data/donations.repo");
const stripeEventsRepo = require("../../../src/data/stripe-events.repo");
const donorsService = require("../../../src/services/donors.service");
const emailLib = require("../../../src/lib/email");
const {
  handleEvent,
  emailFromSession,
} = require("../../../src/services/donations/webhook.service");

const stubDonor = {
  id: "aaaaaaaa-0000-0000-0000-aaaaaaaaaaaa",
  email: "donor@example.com",
  access_token: "tok_demo",
};

/** A pending donation of HKD 2500 — five events at the new 500 divisor. */
const pendingDonation = {
  id: "bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb",
  amount_hkd: 2500,
  frequency: "once",
  status: "pending",
  tracking_opt_in: true,
};

function sessionCompleted(overrides = {}) {
  return {
    id: "evt_test_1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_1",
        payment_intent: "pi_test_1",
        customer_details: { email: "Donor@Example.COM ", name: "Alex Wong" },
        ...overrides,
      },
    },
  };
}

/**
 * @param {import("node:test").TestContext} t
 * @param {{ firstDelivery?: boolean, donation?: object|null }} [options]
 */
function mockDeps(t, { firstDelivery = true, donation = pendingDonation } = {}) {
  const recordOnce = mock.method(stripeEventsRepo, "recordOnce", async () => firstDelivery);
  const upsertDonor = mock.method(donorsService, "upsertDonor", async () => stubDonor);
  const findByStripeSession = mock.method(
    donationsRepo,
    "findByStripeSession",
    async () => donation,
  );
  const updateDonation = mock.method(donationsRepo, "updateDonation", async () => {});
  // Stubbed so the suite does not print an email per test, and so the thank-you can be
  // asserted on. `sendEmail` is otherwise a real console write even in log-mode.
  const sendEmail = mock.method(emailLib, "sendEmail", async () => ({ mode: "log", delivered: true }));
  t.after(() => mock.restoreAll());

  return { recordOnce, upsertDonor, findByStripeSession, updateDonation, sendEmail };
}

test("a duplicate delivery is a no-op — the ledger short-circuits before any write", async (t) => {
  // Stripe retries on timeouts and non-2xx. Without this guard a retry creates a second
  // donor lookup, a second credit, and a second thank-you email.
  const deps = mockDeps(t, { firstDelivery: false });

  const outcome = await handleEvent(sessionCompleted());

  assert.equal(outcome.duplicate, true);
  assert.equal(outcome.handled, true);
  assert.equal(deps.upsertDonor.mock.callCount(), 0, "must not touch donors");
  assert.equal(deps.updateDonation.mock.callCount(), 0, "must not touch donations");
});

test("the event is ledgered before any handler runs", async (t) => {
  const deps = mockDeps(t);
  await handleEvent(sessionCompleted());

  assert.equal(deps.recordOnce.mock.callCount(), 1);
  assert.deepEqual(deps.recordOnce.mock.calls[0].arguments[0], {
    id: "evt_test_1",
    type: "checkout.session.completed",
  });
});

test("a successful payment sends the thank-you carrying the tracking link", async (t) => {
  const deps = mockDeps(t);

  const outcome = await handleEvent(sessionCompleted());

  assert.equal(deps.sendEmail.mock.callCount(), 1);
  const message = deps.sendEmail.mock.calls[0].arguments[0];
  assert.equal(message.to, "donor@example.com");
  assert.ok(
    message.text.includes("/give/track/tok_demo"),
    "the tracking link is the donor's only durable route back to their history",
  );
  assert.equal(outcome.result.email.sent, true);
});

test("a failing thank-you does not fail the webhook", async (t) => {
  // Stripe retries anything that is not a 200. If a mail outage threw out of the handler we
  // would get a retry storm that re-runs allocation on every delivery, so this must degrade
  // to a logged failure and let the 200 through.
  const deps = mockDeps(t);
  deps.sendEmail.mock.mockImplementation(async () => {
    throw new Error("SMTP is on fire");
  });

  const outcome = await handleEvent(sessionCompleted());

  assert.equal(outcome.handled, true, "Stripe must still get a 200");
  assert.equal(outcome.result.email.sent, false);
  assert.match(outcome.result.email.error, /SMTP is on fire/);
  // The donation still completed — the email is the last step, not a gate on it.
  assert.equal(outcome.result.events_credited, 5);
  assert.equal(deps.updateDonation.mock.callCount(), 1);
});

test("checkout.session.completed normalises the email off the session", async (t) => {
  // Stripe collects the address, not our form. Failing to normalise splits one supporter
  // into several donors and collation silently breaks (CONTEXT.md §15).
  const deps = mockDeps(t);
  await handleEvent(sessionCompleted());

  assert.equal(deps.upsertDonor.mock.calls[0].arguments[0].email, "donor@example.com");
});

test("checkout.session.completed snapshots the credit and flips to succeeded", async (t) => {
  const deps = mockDeps(t);
  await handleEvent(sessionCompleted());

  const [donationId, updates] = deps.updateDonation.mock.calls[0].arguments;
  assert.equal(donationId, pendingDonation.id);
  assert.equal(updates.status, "succeeded");
  assert.equal(updates.donor_id, stubDonor.id);
  assert.equal(updates.stripe_payment_intent, "pi_test_1");
  // HKD 2500 at 500/event = 5 events; snapshot 500 as cost_per_event_at_donation.
  assert.equal(updates.events_credited, 5);
  assert.equal(updates.cost_per_event_at_donation, 500);
});

test("an already-succeeded donation is not re-credited", async (t) => {
  // Second line of defence behind the ledger, for a session replayed after the ledger row
  // was somehow lost.
  const deps = mockDeps(t, { donation: { ...pendingDonation, status: "succeeded" } });

  const outcome = await handleEvent(sessionCompleted());

  assert.equal(outcome.result.ignored, true);
  assert.equal(deps.updateDonation.mock.callCount(), 0);
});

test("a session we did not create is ignored, not invented", async (t) => {
  const deps = mockDeps(t, { donation: null });

  const outcome = await handleEvent(sessionCompleted());

  assert.equal(outcome.result.ignored, true);
  assert.equal(deps.updateDonation.mock.callCount(), 0);
});

test("a session with no email throws rather than writing a donor-less donation", async (t) => {
  mockDeps(t);

  await assert.rejects(() =>
    handleEvent(sessionCompleted({ customer_details: {}, customer_email: null })),
  );
});

test("an unhandled event type is ledgered but not acted on", async (t) => {
  const deps = mockDeps(t);

  const outcome = await handleEvent({ id: "evt_x", type: "charge.updated", data: { object: {} } });

  assert.equal(outcome.handled, false);
  assert.equal(deps.recordOnce.mock.callCount(), 1, "still ledgered — nothing silently lost");
  assert.equal(deps.updateDonation.mock.callCount(), 0);
});

test("emailFromSession reads either shape Stripe sends", () => {
  assert.equal(emailFromSession({ customer_details: { email: "A@B.com" } }), "a@b.com");
  assert.equal(emailFromSession({ customer_email: " C@D.com " }), "c@d.com");
  assert.equal(emailFromSession({}), null);
});
