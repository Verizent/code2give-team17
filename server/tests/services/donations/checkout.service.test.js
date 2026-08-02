const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const stripeLib = require("../../../src/lib/stripe");
const donationsRepo = require("../../../src/data/donations.repo");
const {
  createCheckoutSession,
  toCents,
  MAX_AMOUNT_HKD,
} = require("../../../src/services/donations/checkout.service");

const URLS = { clientOrigin: "http://localhost:5173" };

/**
 * @param {import("node:test").TestContext} t
 */
function mockStripe(t) {
  const create = mock.fn(async () => ({
    id: "cs_test_123",
    url: "https://checkout.stripe.com/c/pay/cs_test_123",
  }));

  mock.method(stripeLib, "getStripe", () => ({ checkout: { sessions: { create } } }));
  const insertPending = mock.method(donationsRepo, "insertPendingDonation", async () => ({
    id: "dddddddd-0000-0000-0000-dddddddddddd",
  }));
  t.after(() => mock.restoreAll());

  return { create, insertPending };
}

test("converts integer dollars to cents exactly once", () => {
  // CONTEXT.md §29: amount_hkd is integer dollars across the API and the x100 lives
  // server-side. Converting in both directions cancels out in testing and only surfaces
  // as a 100x error in front of an audience.
  assert.equal(toCents(510), 51000);
  assert.equal(toCents(4), 400);
  assert.equal(toCents(10000), 1000000);
});

test("the Stripe session carries cents, and the API response never does", async (t) => {
  const deps = mockStripe(t);

  const result = await createCheckoutSession({ amount_hkd: 510 }, URLS);

  const sent = deps.create.mock.calls[0].arguments[0];
  assert.equal(sent.line_items[0].price_data.unit_amount, 51000, "Stripe wants cents");
  assert.equal(sent.line_items[0].price_data.currency, "hkd");

  // The row we store, and everything we return, stays in dollars.
  assert.equal(deps.insertPending.mock.calls[0].arguments[0].amount_hkd, 510);
  assert.equal(JSON.stringify(result).includes("51000"), false, "cents must not cross the API");
});

test("a one-off gift is mode=payment; monthly is a subscription", async (t) => {
  const deps = mockStripe(t);

  await createCheckoutSession({ amount_hkd: 100 }, URLS);
  assert.equal(deps.create.mock.calls[0].arguments[0].mode, "payment");
  assert.equal(deps.create.mock.calls[0].arguments[0].line_items[0].price_data.recurring, undefined);

  await createCheckoutSession({ amount_hkd: 100, frequency: "monthly" }, URLS);
  const recurring = deps.create.mock.calls[1].arguments[0];
  assert.equal(recurring.mode, "subscription");
  assert.deepEqual(recurring.line_items[0].price_data.recurring, { interval: "month" });
});

test("weekly bills weekly — it is never quietly converted to monthly", async (t) => {
  // The donate form has always offered Weekly, but the checkout schema accepted only
  // `once | monthly`, so the value was rewritten client-side and the donor was charged
  // monthly against a button that said Weekly. Stripe supports `week` (verified against the
  // live sandbox alongside day/month/year); the restriction was ours, not Stripe's.
  const deps = mockStripe(t);

  await createCheckoutSession({ amount_hkd: 100, frequency: "weekly" }, URLS);

  const sent = deps.create.mock.calls[0].arguments[0];
  assert.equal(sent.mode, "subscription");
  assert.deepEqual(sent.line_items[0].price_data.recurring, { interval: "week" });
  assert.equal(deps.insertPending.mock.calls[0].arguments[0].frequency, "weekly");
});

test("the card-statement name states the cadence the donor chose", async (t) => {
  // This string is what shows up on a bank statement, so a weekly subscription reading
  // "Monthly gift" is a chargeback waiting to happen.
  const deps = mockStripe(t);

  for (const frequency of ["once", "weekly", "monthly"]) {
    await createCheckoutSession({ amount_hkd: 100, frequency }, URLS);
  }

  const names = deps.create.mock.calls.map(
    (call) => call.arguments[0].line_items[0].price_data.product_data.name,
  );
  assert.deepEqual(names, [
    "Gift to Love 21",
    "Weekly gift to Love 21",
    "Monthly gift to Love 21",
  ]);
});

test("Stripe returns the donor to routes the client actually serves", async (t) => {
  // Regression: these read `/donate/thanks` and `/donate`, neither of which App.jsx defines.
  // The router's `*` catch-all swallowed them and sent a paying donor to the homepage. Stripe
  // cannot detect this — any 200 counts as a successful return — so only an assertion here
  // stops it recurring. Keep these strings in step with client/src/App.jsx.
  const deps = mockStripe(t);

  await createCheckoutSession({ amount_hkd: 100 }, URLS);
  const sent = deps.create.mock.calls[0].arguments[0];

  assert.equal(
    sent.success_url,
    "http://localhost:5173/give/thanks?session_id={CHECKOUT_SESSION_ID}",
  );
  assert.equal(sent.cancel_url, "http://localhost:5173/give?cancelled=1");

  // The thanks page polls GET /api/donations/session/:id and has nothing to poll without it.
  assert.ok(
    sent.success_url.includes("{CHECKOUT_SESSION_ID}"),
    "Stripe must interpolate the session id into the success URL",
  );
});

test("the donation is created pending, pointing at the session, with no donor yet", async (t) => {
  // The donor is unknown until the webhook carries the email Stripe collected — our form
  // has no email field at all (CONTEXT.md §15).
  const deps = mockStripe(t);

  await createCheckoutSession({ amount_hkd: 250 }, URLS);

  const row = deps.insertPending.mock.calls[0].arguments[0];
  assert.equal(row.stripe_session_id, "cs_test_123");
  assert.equal(row.donor_id, undefined, "donor_id must not be set at checkout time");
  assert.equal(row.tracking_opt_in, true, "gift-updates consent defaults on (CONTEXT.md §15)");
});

test("rejects an amount below the Stripe minimum with 400", async (t) => {
  mockStripe(t);

  for (const amount of [0, 3, -10, 10.5]) {
    await assert.rejects(
      () => createCheckoutSession({ amount_hkd: amount }, URLS),
      (error) => {
        assert.equal(error.status, 400);
        return true;
      },
      `HKD ${amount} should be rejected`,
    );
  }
});

// Above MAX_AMOUNT_HKD the ×100 to cents passes Stripe's unit_amount ceiling and the SDK
// throws mid-call, which surfaced to the donate form as a 500 quoting a raw Stripe message.
// The bound has to be ours, and it has to be a 400.
test("rejects an amount above the maximum with 400", async (t) => {
  mockStripe(t);

  for (const amount of [MAX_AMOUNT_HKD + 1, 99_999_999_999]) {
    await assert.rejects(
      () => createCheckoutSession({ amount_hkd: amount }, URLS),
      (error) => {
        assert.equal(error.status, 400);
        return true;
      },
      `HKD ${amount} should be rejected`,
    );
  }
});

test("accepts the maximum amount exactly", async (t) => {
  mockStripe(t);

  const result = await createCheckoutSession({ amount_hkd: MAX_AMOUNT_HKD }, URLS);
  assert.ok(result.checkout_url);
});

test("no programme is ever sent to Stripe or stored", async (t) => {
  // Donors do not choose a designation (PLAN.md §3). This pins it at the service boundary
  // as well as the Zod schema.
  const deps = mockStripe(t);

  await createCheckoutSession({ amount_hkd: 500 }, URLS);

  assert.equal("programme" in deps.insertPending.mock.calls[0].arguments[0], false);
  assert.equal(JSON.stringify(deps.create.mock.calls[0].arguments[0]).includes("programme"), false);
});
