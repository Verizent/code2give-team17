const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const donorsRepo = require("../../../src/data/donors.repo");
const donationsRepo = require("../../../src/data/donations.repo");
const {
  recordDonation,
  recoverLink,
  mapFrequency,
} = require("../../../src/services/donations/donations.service");

test("mapFrequency normalises Stripe-style one_time", () => {
  assert.equal(mapFrequency("one_time"), "once");
  assert.equal(mapFrequency("monthly"), "monthly");
});

test("recordDonation creates donor then donation", async (t) => {
  mock.method(donorsRepo, "findByEmail", async () => null);
  mock.method(donorsRepo, "insert", async () => ({
    id: "d1111111-1111-4111-8111-111111111111",
    email: "donor@example.com",
    full_name: null,
    locale: "en",
    tracking_opt_in: true,
    access_token: "a".repeat(32),
    profile_id: null,
  }));
  mock.method(donationsRepo, "insert", async (input) => ({
    id: "e2222222-2222-4222-8222-222222222222",
    ...input,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
  }));
  t.after(() => mock.restoreAll());

  const result = await recordDonation(
    {
      amount_hkd: 500,
      frequency: "once",
      programme: "sports",
      email: "Donor@Example.com",
      tracking_opt_in: true,
    },
    null,
  );

  assert.equal(result.donation.amount_hkd, 500);
  assert.equal(result.donor.email, "donor@example.com");
  assert.equal(result.donor.access_token.length, 32);
});

test("recoverLink returns identical shape regardless of email", async (t) => {
  mock.method(donorsRepo, "findByEmail", async () => null);
  t.after(() => mock.restoreAll());

  const unknown = await recoverLink("nobody@example.com");
  assert.equal(unknown.ok, true);

  mock.restoreAll();
  mock.method(donorsRepo, "findByEmail", async () => ({ id: "x" }));
  t.after(() => mock.restoreAll());

  const known = await recoverLink("someone@example.com");
  assert.deepEqual(Object.keys(known).sort(), Object.keys(unknown).sort());
  assert.equal(known.message, unknown.message);
});
