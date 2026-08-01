const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const donorsService = require("../../src/services/donors.service");
const donationsRepo = require("../../src/data/donations.repo");
const { createDonation, submitFeedback } = require("../../src/services/donations.service");

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

test("createDonation returns access_token from the donor record", async (t) => {
  mockDeps(t);
  const result = await createDonation({ email: "donor@example.com", amount_hkd: 500 });
  assert.equal(result.access_token, stubDonor.access_token);
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
