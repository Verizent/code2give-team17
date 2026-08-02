const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const donorsService = require("../../src/services/donors.service");
const donationsRepo = require("../../src/data/donations.repo");
const donorsRepo = require("../../src/data/donors.repo");
const {
  createDonation,
  submitFeedback,
  getCheckoutStatus,
} = require("../../src/services/donations.service");

const stubDonor = {
  id: "aaaaaaaa-0000-0000-0000-aaaaaaaaaaaa",
  email: "donor@example.com",
  access_token: "tok_demo",
};

const stubDonation = {
  id: "bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb",
  donor_id: stubDonor.id,
  amount_hkd: 500,
  status: "succeeded",
  created_at: new Date().toISOString(),
};

function mockDeps(t) {
  mock.method(donorsService, "upsertDonor", async () => stubDonor);
  mock.method(donationsRepo, "insertDonation", async () => stubDonation);
  t.after(() => mock.restoreAll());
}

test("createDonation rejects a missing or empty email with 400", async (t) => {
  mockDeps(t);
  await assert.rejects(() => createDonation({ email: "", amount_hkd: 100 }), (err) => {
    assert.equal(err.status, 400);
    return true;
  });
});

test("createDonation rejects a non-integer amount_hkd with 400", async (t) => {
  mockDeps(t);
  await assert.rejects(() => createDonation({ email: "a@b.com", amount_hkd: 99.5 }), (err) => {
    assert.equal(err.status, 400);
    return true;
  });
});

test("createDonation rejects amount_hkd below 1 with 400", async (t) => {
  mockDeps(t);
  await assert.rejects(() => createDonation({ email: "a@b.com", amount_hkd: 0 }), (err) => {
    assert.equal(err.status, 400);
    return true;
  });
});

test("createDonation normalises email before passing to upsertDonor", async (t) => {
  const upsertDonor = mock.method(donorsService, "upsertDonor", async () => stubDonor);
  mock.method(donationsRepo, "insertDonation", async () => stubDonation);
  t.after(() => mock.restoreAll());

  await createDonation({ email: "  DONOR@Example.COM  ", amount_hkd: 500 });

  const calledEmail = upsertDonor.mock.calls[0].arguments[0].email;
  assert.equal(calledEmail, "donor@example.com");
});

/**
 * `donors.access_token` is a bearer capability: whoever holds it can read that donor's
 * tracking page — their gift history, amounts and name. schema/README.md §77 states the
 * rule for the volunteer equivalent ("never log it, never put it in an error message")
 * and tests/services/auth/me.test.js enforces it there. These are the donations-side
 * counterpart.
 *
 * The endpoint that reaches this service, POST /api/donations, is unauthenticated and
 * takes an arbitrary email. `upsertDonor` resolves a returning address to the EXISTING
 * row, so returning the token meant anyone who knew a supporter's email address could
 * ask for it and receive their live tracking token. It previously did exactly that, and
 * the test asserting so is what these replace.
 */

test("createDonation never returns a donor access_token", async (t) => {
  mockDeps(t);

  const result = await createDonation({ email: "donor@example.com", amount_hkd: 500 });

  assert.equal("access_token" in result, false);
  assert.equal(
    JSON.stringify(result).includes(stubDonor.access_token),
    false,
    "the token must not appear anywhere in the response, under any key",
  );
});

test("createDonation on a returning email discloses nothing about the existing donor", async (t) => {
  // The pre-registration shape of the same bug: an attacker seeds the address first, or
  // simply guesses one already in the table. Either way the response must not carry the
  // capability that reaches that person's tracking page.
  mockDeps(t);

  const result = await createDonation({ email: "donor@example.com", amount_hkd: 1 });

  assert.equal(result.access_token, undefined);
  assert.equal(result.tracking_token, undefined);
});

/**
 * submitFeedback — the post-payment optional form (PLAN.md §Phase C3).
 * Fills message, referral_source, referral_source_other, is_anonymous on a succeeded donation.
 */

test("submitFeedback updates the succeeded donation with the provided fields", async (t) => {
  mock.method(donationsRepo, "findById", async () => ({
    id: stubDonation.id, status: "succeeded",
  }));
  const updateFeedback = mock.method(donationsRepo, "updateFeedback", async (id, fields) => ({
    id, ...fields,
  }));
  t.after(() => mock.restoreAll());

  await submitFeedback(stubDonation.id, {
    message: "For the kids",
    referral_source: "friend",
    is_anonymous: true,
  });

  const [id, fields] = updateFeedback.mock.calls[0].arguments;
  assert.equal(id, stubDonation.id);
  assert.equal(fields.message, "For the kids");
  assert.equal(fields.referral_source, "friend");
  assert.equal(fields.is_anonymous, true);
});

test("submitFeedback rejects when the donation is not succeeded — 400", async (t) => {
  mock.method(donationsRepo, "findById", async () => ({
    id: stubDonation.id, status: "pending",
  }));
  t.after(() => mock.restoreAll());

  await assert.rejects(() => submitFeedback(stubDonation.id, { message: "hi" }), (err) => {
    assert.equal(err.status, 400);
    return true;
  });
});

test("submitFeedback throws 404 when the donation does not exist", async (t) => {
  mock.method(donationsRepo, "findById", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(() => submitFeedback("no-such-id", { message: "hi" }), (err) => {
    assert.equal(err.status, 404);
    return true;
  });
});

test("submitFeedback with an empty body still succeeds — every field is optional", async (t) => {
  mock.method(donationsRepo, "findById", async () => ({
    id: stubDonation.id, status: "succeeded",
  }));
  const updateFeedback = mock.method(donationsRepo, "updateFeedback", async (id, fields) => ({
    id, ...fields,
  }));
  t.after(() => mock.restoreAll());

  await submitFeedback(stubDonation.id, {});

  assert.equal(updateFeedback.mock.callCount(), 1);
});

/**
 * getCheckoutStatus — the thanks-page poll (PLAN.md §3 A5).
 *
 * `tracking_opt_in` lives on the donation row itself, not only on the donor, so both the
 * still-pending and the opted-out answers are decidable without reading `donors` at all.
 * These tests assert the lookup is SKIPPED rather than performed-and-discarded: returning
 * `tracking_token: null` after fetching the donor would satisfy the response shape while
 * still touching a table the caller has no right to on that path.
 */

const stubSession = "cs_test_a1b2c3";

function succeededDonation(overrides = {}) {
  return {
    id: stubDonation.id,
    donor_id: stubDonor.id,
    amount_hkd: 500,
    frequency: "once",
    status: "succeeded",
    events_credited: 1,
    tracking_opt_in: true,
    ...overrides,
  };
}

test("getCheckoutStatus returns tracking_token when succeeded and opted in", async (t) => {
  mock.method(donationsRepo, "findByStripeSession", async () => succeededDonation());
  mock.method(donorsRepo, "findById", async () => stubDonor);
  t.after(() => mock.restoreAll());

  const result = await getCheckoutStatus(stubSession);

  assert.equal(result.tracking_token, stubDonor.access_token);
  assert.equal(result.status, "succeeded");
  assert.equal(result.amount_hkd, 500);
  assert.equal(result.frequency, "once");
  assert.equal(result.events_credited, 1);
});

test("getCheckoutStatus omits tracking_token while the payment is still pending, without reading donors", async (t) => {
  mock.method(donationsRepo, "findByStripeSession", async () =>
    succeededDonation({ status: "pending", events_credited: null }),
  );
  const findById = mock.method(donorsRepo, "findById", async () => stubDonor);
  t.after(() => mock.restoreAll());

  const result = await getCheckoutStatus(stubSession);

  assert.equal("tracking_token" in result, false);
  assert.equal(result.status, "pending");
  assert.equal(findById.mock.callCount(), 0, "donor lookup must be skipped, not nulled");
});

test("getCheckoutStatus omits tracking_token when the donor opted out, without reading donors", async (t) => {
  mock.method(donationsRepo, "findByStripeSession", async () =>
    succeededDonation({ tracking_opt_in: false }),
  );
  const findById = mock.method(donorsRepo, "findById", async () => stubDonor);
  t.after(() => mock.restoreAll());

  const result = await getCheckoutStatus(stubSession);

  assert.equal("tracking_token" in result, false);
  assert.equal(result.status, "succeeded");
  assert.equal(findById.mock.callCount(), 0, "donor lookup must be skipped, not nulled");
});

test("getCheckoutStatus throws 404 for an unknown checkout session", async (t) => {
  mock.method(donationsRepo, "findByStripeSession", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(() => getCheckoutStatus("cs_test_nope"), (err) => {
    assert.equal(err.status, 404);
    return true;
  });
});

test("getCheckoutStatus tolerates a succeeded donation whose donor_id is not attached yet", async (t) => {
  // The webhook sets status and donor_id in the same write, but the row is created at
  // checkout with donor_id null (donations.repo.js). A poll landing mid-write must not 500.
  mock.method(donationsRepo, "findByStripeSession", async () =>
    succeededDonation({ donor_id: null }),
  );
  const findById = mock.method(donorsRepo, "findById", async () => stubDonor);
  t.after(() => mock.restoreAll());

  const result = await getCheckoutStatus(stubSession);

  assert.equal("tracking_token" in result, false);
  assert.equal(findById.mock.callCount(), 0);
});
