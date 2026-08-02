const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const nodemailer = require("nodemailer");
const emailLib = require("../../src/lib/email");

/** Restores every EMAIL_/SMTP_ var the test touched, so ordering cannot leak. */
function withEnv(t, vars) {
  const saved = {};
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  t.after(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    mock.restoreAll();
  });
}

const SMTP_OK = {
  EMAIL_MODE: "smtp",
  SMTP_HOST: "smtp.example.com",
  SMTP_PORT: "587",
  SMTP_USER: "bot@love21.test",
  SMTP_PASS: "app-password",
  SMTP_FROM: undefined,
  SMTP_SECURE: undefined,
};

function stubTransport(t) {
  const sendMail = mock.fn(async () => ({ messageId: "<abc@love21.test>" }));
  const createTransport = mock.method(nodemailer, "createTransport", () => ({
    sendMail,
    verify: async () => true,
  }));
  t.after(() => mock.restoreAll());
  return { sendMail, createTransport };
}

test("log mode is the default and never opens a connection", async (t) => {
  withEnv(t, { EMAIL_MODE: undefined });
  const deps = stubTransport(t);

  const result = await emailLib.sendEmail({ to: "a@b.com", subject: "s", text: "t" });

  assert.equal(result.mode, "log");
  assert.equal(deps.createTransport.mock.callCount(), 0, "log mode must not reach SMTP");
});

test("EMAIL_MODE=send throws and points at smtp", async (t) => {
  withEnv(t, { EMAIL_MODE: "send" });

  await assert.rejects(
    () => emailLib.sendEmail({ to: "a@b.com", subject: "s", text: "t" }),
    /EMAIL_MODE=smtp/,
    "the old Resend path must name its replacement, not just fail",
  );
});

test("smtp mode sends the message and reports the provider's id", async (t) => {
  withEnv(t, SMTP_OK);
  const deps = stubTransport(t);

  const result = await emailLib.sendEmail({
    to: "mei@example.com",
    subject: "Thank you for your gift to Love 21",
    text: "plain",
    html: "<p>rich</p>",
  });

  const sent = deps.sendMail.mock.calls[0].arguments[0];
  assert.equal(sent.to, "mei@example.com");
  assert.equal(sent.text, "plain");
  assert.equal(sent.html, "<p>rich</p>");
  assert.equal(sent.from, "bot@love21.test", "From defaults to the authenticated mailbox");
  assert.deepEqual(result, { mode: "smtp", delivered: true, id: "<abc@love21.test>" });
});

test("a text-only message carries no empty html part", async (t) => {
  // Distinct host so this gets its own transport: the module caches by config, so a test
  // reusing SMTP_OK verbatim would be asserting against the previous test's stub.
  withEnv(t, { ...SMTP_OK, SMTP_HOST: "smtp.text-only.test" });
  const deps = stubTransport(t);

  await emailLib.sendEmail({ to: "a@b.com", subject: "s", text: "t" });

  assert.equal("html" in deps.sendMail.mock.calls[0].arguments[0], false);
});

test("missing credentials name every one that is absent", async (t) => {
  // The failure mode this prevents: one vague "SMTP error" that sends someone hunting
  // through three separate settings.
  withEnv(t, { ...SMTP_OK, SMTP_HOST: undefined, SMTP_PASS: undefined });

  await assert.rejects(
    () => emailLib.sendEmail({ to: "a@b.com", subject: "s", text: "t" }),
    (error) => {
      assert.match(error.message, /SMTP_HOST/);
      assert.match(error.message, /SMTP_PASS/);
      assert.equal(/SMTP_USER/.test(error.message), false, "only the missing ones");
      assert.match(error.message, /EMAIL_MODE=log/, "and offers the way out");
      return true;
    },
  );
});

test("port 465 implies TLS; 587 does not", async (t) => {
  // Getting this backwards produces a connection that hangs rather than a clear error.
  withEnv(t, { ...SMTP_OK, SMTP_PORT: "465" });
  const deps = stubTransport(t);

  await emailLib.sendEmail({ to: "a@b.com", subject: "s", text: "t" });
  assert.equal(deps.createTransport.mock.calls[0].arguments[0].secure, true);
});

test("SMTP_SECURE overrides the port-based guess", async (t) => {
  withEnv(t, { ...SMTP_OK, SMTP_PORT: "2525", SMTP_SECURE: "true" });
  const deps = stubTransport(t);

  await emailLib.sendEmail({ to: "a@b.com", subject: "s", text: "t" });
  const config = deps.createTransport.mock.calls[0].arguments[0];
  assert.equal(config.secure, true);
  assert.equal(config.port, 2525);
});

test("SMTP_FROM wins over the authenticated user when set", async (t) => {
  withEnv(t, {
    ...SMTP_OK,
    SMTP_HOST: "smtp.from.test",
    SMTP_FROM: "Love 21 <hello@love21foundation.com>",
  });
  const deps = stubTransport(t);

  await emailLib.sendEmail({ to: "a@b.com", subject: "s", text: "t" });
  assert.equal(
    deps.sendMail.mock.calls[0].arguments[0].from,
    "Love 21 <hello@love21foundation.com>",
  );
});

test("changing SMTP settings rebuilds the transport rather than reusing stale ones", async (t) => {
  // Regression: the transport was originally cached with a plain `if (!transport)`, which
  // pinned whichever settings it first saw. Correcting a typo'd SMTP_HOST in .env then
  // appeared to change nothing until the process was restarted — and the failure it produced
  // was a connection error pointing at a host no longer in the config.
  withEnv(t, { ...SMTP_OK, SMTP_HOST: "smtp.first.test" });
  const deps = stubTransport(t);

  await emailLib.sendEmail({ to: "a@b.com", subject: "s", text: "t" });
  assert.equal(deps.createTransport.mock.calls[0].arguments[0].host, "smtp.first.test");

  process.env.SMTP_HOST = "smtp.corrected.test";
  await emailLib.sendEmail({ to: "a@b.com", subject: "s", text: "t" });

  assert.equal(deps.createTransport.mock.callCount(), 2, "must rebuild on a config change");
  assert.equal(deps.createTransport.mock.calls[1].arguments[0].host, "smtp.corrected.test");

  // ...but an unchanged config must still reuse the pooled connection.
  await emailLib.sendEmail({ to: "a@b.com", subject: "s", text: "t" });
  assert.equal(deps.createTransport.mock.callCount(), 2, "no needless rebuild");
});

test("verifyTransport checks the connection without sending", async (t) => {
  withEnv(t, { ...SMTP_OK, SMTP_HOST: "smtp.verify.test" });
  const deps = stubTransport(t);

  const info = await emailLib.verifyTransport();

  assert.deepEqual(info, {
    ok: true,
    host: "smtp.verify.test",
    port: 587,
    user: "bot@love21.test",
  });
  assert.equal(deps.sendMail.mock.callCount(), 0, "verify must not send anything");
});
