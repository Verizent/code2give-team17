const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const donorsRepo = require("../../src/data/donors.repo");
const { upsertDonor } = require("../../src/services/donors.service");

// Minimal stub shape the repo returns
const stubDonor = {
  id: "aaaaaaaa-0000-0000-0000-aaaaaaaaaaaa",
  email: "alice@example.com",
  access_token: "tok_abc",
  full_name: null,
  tracking_opt_in: true,
};

test("upsertDonor normalises the email before lookup and storage", async (t) => {
  const findByEmail = mock.method(donorsRepo, "findByEmail", async () => null);
  mock.method(donorsRepo, "createDonor", async (row) => ({ ...stubDonor, email: row.email }));
  t.after(() => mock.restoreAll());

  await upsertDonor({ email: "  ALICE@Example.COM  ", trackingOptIn: true });

  const calledWith = findByEmail.mock.calls[0].arguments[0];
  assert.equal(calledWith, "alice@example.com", "lookup uses normalised email");
});

test("upsertDonor returns the existing donor without creating a new one", async (t) => {
  mock.method(donorsRepo, "findByEmail", async () => stubDonor);
  const createDonor = mock.method(donorsRepo, "createDonor", async () => {
    throw new Error("should not create when donor already exists");
  });
  t.after(() => mock.restoreAll());

  const result = await upsertDonor({ email: "alice@example.com", trackingOptIn: true });

  assert.equal(result.id, stubDonor.id);
  assert.equal(createDonor.mock.calls.length, 0);
});

test("upsertDonor creates a new donor when email is not found", async (t) => {
  mock.method(donorsRepo, "findByEmail", async () => null);
  const createDonor = mock.method(donorsRepo, "createDonor", async (row) => ({
    ...stubDonor,
    email: row.email,
  }));
  t.after(() => mock.restoreAll());

  await upsertDonor({ email: "new@example.com", trackingOptIn: true });

  assert.equal(createDonor.mock.calls.length, 1);
  assert.equal(createDonor.mock.calls[0].arguments[0].email, "new@example.com");
});

test("upsertDonor access_token is stable — same donor returns same token", async (t) => {
  mock.method(donorsRepo, "findByEmail", async () => stubDonor);
  mock.method(donorsRepo, "updateDonor", async () => {});
  t.after(() => mock.restoreAll());

  const first = await upsertDonor({ email: "alice@example.com", trackingOptIn: true });
  const second = await upsertDonor({ email: "alice@example.com", trackingOptIn: true });

  assert.equal(first.access_token, second.access_token);
});
