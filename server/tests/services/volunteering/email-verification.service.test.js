const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const verificationsRepo = require("../../../src/data/volunteer-email-verifications.repo");
const emailLib = require("../../../src/lib/email");
const emailVerification = require("../../../src/services/volunteering/email-verification.service");

const ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const EMAIL = "user@example.com";

function futureIso(minutes) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function pastIso(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

test("startVerification normalises the email, persists a hashed code, and echoes the demo code when EMAIL_MODE=console", async (t) => {
  const original = process.env.EMAIL_MODE;
  process.env.EMAIL_MODE = "console";
  const createVerification = mock.fn(async (values) => ({
    id: ID,
    email: values.email,
    expires_at: values.expires_at,
  }));
  mock.method(verificationsRepo, "createVerification", createVerification);
  t.after(() => {
    mock.restoreAll();
    process.env.EMAIL_MODE = original;
  });

  const response = await emailVerification.startVerification("  User@Example.COM  ");

  assert.equal(response.email, EMAIL, "trimmed and lower-cased");
  assert.ok(response.expires_at);
  assert.ok(response.demo_code, "console mode returns the plaintext code for demo playback");
  const persisted = createVerification.mock.calls[0].arguments[0];
  assert.equal(persisted.email, EMAIL);
  assert.notEqual(persisted.code_hash, response.demo_code, "code stored as a hash, not plaintext");
});

test("confirmVerification returns a verification_token on the happy path", async (t) => {
  mock.method(verificationsRepo, "findVerificationById", async () => ({
    id: ID,
    email: EMAIL,
    code_hash: "hashed",
    attempts: 0,
    consumed_at: null,
    expires_at: futureIso(10),
  }));
  mock.method(verificationsRepo, "codesMatch", () => true);
  mock.method(verificationsRepo, "updateVerification", async (_id, patch) => ({
    id: ID,
    ...patch,
  }));
  t.after(() => mock.restoreAll());

  const result = await emailVerification.confirmVerification(ID, "123456");

  assert.ok(result.verification_token);
  assert.equal(result.email, EMAIL);
  assert.ok(result.verification_token_expires_at);
});

test("confirmVerification 400s an expired code", async (t) => {
  mock.method(verificationsRepo, "findVerificationById", async () => ({
    id: ID,
    email: EMAIL,
    code_hash: "hashed",
    attempts: 0,
    consumed_at: null,
    expires_at: pastIso(1),
  }));
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => emailVerification.confirmVerification(ID, "123456"),
    (error) => {
      assert.equal(error.status, 400);
      return true;
    },
  );
});

test("confirmVerification 400s a wrong code and bumps the attempt count", async (t) => {
  mock.method(verificationsRepo, "findVerificationById", async () => ({
    id: ID,
    email: EMAIL,
    code_hash: "hashed",
    attempts: 2,
    consumed_at: null,
    expires_at: futureIso(10),
  }));
  mock.method(verificationsRepo, "codesMatch", () => false);
  const increment = mock.fn(async () => undefined);
  mock.method(verificationsRepo, "incrementAttempts", increment);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => emailVerification.confirmVerification(ID, "999999"),
    (error) => {
      assert.equal(error.status, 400);
      return true;
    },
  );
  assert.equal(increment.mock.calls.length, 1);
  assert.equal(increment.mock.calls[0].arguments[0], ID);
  assert.equal(increment.mock.calls[0].arguments[1], 2);
});

test("confirmVerification 404s an unknown id (privacy — no distinction between wrong code and unknown request)", async (t) => {
  mock.method(verificationsRepo, "findVerificationById", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => emailVerification.confirmVerification(ID, "123456"),
    (error) => {
      assert.equal(error.status, 404);
      return true;
    },
  );
});

/**
 * The code was generated, hashed and stored, but never delivered. That was survivable
 * while EMAIL_MODE was effectively always log-mode and `demo_code` came back in the
 * response; with real SMTP wired, a verification nobody can receive is a dead end.
 */
test("startVerification emails the code to the address being verified", async (t) => {
  const original = process.env.EMAIL_MODE;
  process.env.EMAIL_MODE = "smtp";
  mock.method(verificationsRepo, "createVerification", async (values) => ({
    id: ID,
    email: values.email,
    expires_at: values.expires_at,
  }));
  const sendEmail = mock.fn(async () => ({ mode: "smtp", delivered: true }));
  mock.method(emailLib, "sendEmail", sendEmail);
  t.after(() => {
    mock.restoreAll();
    process.env.EMAIL_MODE = original;
  });

  const response = await emailVerification.startVerification("  User@Example.COM  ");

  assert.equal(sendEmail.mock.callCount(), 1);
  const [message] = sendEmail.mock.calls[0].arguments;
  assert.equal(message.to, EMAIL, "sent to the address being proved, never anywhere else");
  assert.match(message.subject, /verification code/i);
  const code = message.text.match(/\b(\d{6})\b/);
  assert.ok(code, "the six-digit code appears in the body");
  assert.equal(response.demo_code, undefined, "plaintext code never leaves via the API");
});

test("startVerification withholds demo_code outside console mode", async (t) => {
  const original = process.env.EMAIL_MODE;
  process.env.EMAIL_MODE = "log";
  mock.method(verificationsRepo, "createVerification", async (values) => ({
    id: ID,
    email: values.email,
    expires_at: values.expires_at,
  }));
  mock.method(emailLib, "sendEmail", async () => ({ mode: "log", delivered: true }));
  t.after(() => {
    mock.restoreAll();
    process.env.EMAIL_MODE = original;
  });

  const response = await emailVerification.startVerification(EMAIL);
  assert.equal(response.demo_code, undefined);
});

/**
 * A verification the requester cannot receive is worthless, and silently returning 201
 * would strand them on a code-entry screen forever. Fail loudly instead.
 */
test("startVerification surfaces a delivery failure rather than returning a dead verification", async (t) => {
  const original = process.env.EMAIL_MODE;
  process.env.EMAIL_MODE = "smtp";
  mock.method(verificationsRepo, "createVerification", async (values) => ({
    id: ID,
    email: values.email,
    expires_at: values.expires_at,
  }));
  mock.method(emailLib, "sendEmail", async () => {
    throw new Error("535 auth failed");
  });
  t.after(() => {
    mock.restoreAll();
    process.env.EMAIL_MODE = original;
  });

  await assert.rejects(() => emailVerification.startVerification(EMAIL), (error) => {
    assert.equal(error.status, 502);
    return true;
  });
});
