const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const donorsService = require("../../src/services/donors.service");
const donationsRepo = require("../../src/data/donations.repo");
const { createDonation } = require("../../src/services/donations.service");

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
