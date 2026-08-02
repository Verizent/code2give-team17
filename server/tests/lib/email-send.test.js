const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const nodemailer = require("nodemailer");

const { sendEmail, __resetTransport } = require("../../src/lib/email");

/**
 * EMAIL_MODE was previously a two-way switch: `send` threw, and literally every other
 * value fell through to console.log. That meant `EMAIL_MODE=smtp` — which is what
 * server/.env carries, alongside a full set of SMTP_* credentials — silently rendered to
 * stdout, so every email the app "sent" reached nobody while reporting delivered: true.
 * These tests pin the smtp mode down so that cannot recur.
 */

function withEnv(t, values) {
  const saved = { ...process.env };
  Object.assign(process.env, values);
  t.after(() => {
    process.env = saved;
    __resetTransport();
    mock.restoreAll();
  });
  __resetTransport();
}

const SMTP_ENV = {
  EMAIL_MODE: "smtp",
  SMTP_HOST: "smtp.example.test",
  SMTP_PORT: "587",
  SMTP_USER: "ops@love21.test",
  SMTP_PASS: "hunter2",
};

test("smtp mode sends through the configured transport", async (t) => {
  withEnv(t, SMTP_ENV);
  const sendMail = mock.fn(async () => ({ messageId: "<abc@love21.test>" }));
  mock.method(nodemailer, "createTransport", () => ({ sendMail }));

  const result = await sendEmail({
    to: "someone@example.test",
    subject: "ENQUIRY FROM Dana Ops",
    text: "body",
  });

  assert.equal(sendMail.mock.callCount(), 1);
  const [message] = sendMail.mock.calls[0].arguments;
  assert.equal(message.to, "someone@example.test");
  assert.equal(message.subject, "ENQUIRY FROM Dana Ops");
  assert.equal(message.from, "ops@love21.test");
  assert.equal(result.mode, "smtp");
  assert.equal(result.delivered, true);
  assert.equal(result.id, "<abc@love21.test>");
});

test("smtp mode builds the transport from the SMTP_* vars, secure only on 465", async (t) => {
  withEnv(t, { ...SMTP_ENV, SMTP_PORT: "465" });
  const createTransport = mock.fn(() => ({ sendMail: async () => ({ messageId: "x" }) }));
  mock.method(nodemailer, "createTransport", createTransport);

  await sendEmail({ to: "a@b.test", subject: "s", text: "t" });

  const [config] = createTransport.mock.calls[0].arguments;
  assert.equal(config.host, "smtp.example.test");
  assert.equal(config.port, 465);
  assert.equal(config.secure, true);
  assert.deepEqual(config.auth, { user: "ops@love21.test", pass: "hunter2" });
});

test("smtp mode reuses one transport across sends", async (t) => {
  withEnv(t, SMTP_ENV);
  const createTransport = mock.fn(() => ({ sendMail: async () => ({ messageId: "x" }) }));
  mock.method(nodemailer, "createTransport", createTransport);

  await sendEmail({ to: "a@b.test", subject: "s", text: "t" });
  await sendEmail({ to: "c@d.test", subject: "s", text: "t" });

  assert.equal(createTransport.mock.callCount(), 1);
});

/**
 * The whole point of this change: a misconfigured smtp mode must fail loudly. Falling
 * back to console.log here would recreate the exact bug — an app that believes it sent
 * mail it never sent.
 */
test("smtp mode throws on missing config rather than quietly logging", async (t) => {
  withEnv(t, { EMAIL_MODE: "smtp", SMTP_HOST: "", SMTP_USER: "", SMTP_PASS: "" });

  await assert.rejects(
    () => sendEmail({ to: "a@b.test", subject: "s", text: "t" }),
    /SMTP_HOST/,
  );
});

test("smtp mode surfaces a transport failure instead of reporting delivered", async (t) => {
  withEnv(t, SMTP_ENV);
  mock.method(nodemailer, "createTransport", () => ({
    sendMail: async () => {
      throw new Error("535 auth failed");
    },
  }));

  await assert.rejects(() => sendEmail({ to: "a@b.test", subject: "s", text: "t" }), /535/);
});

test("log mode still renders to stdout and reports the log mode", async (t) => {
  withEnv(t, { EMAIL_MODE: "log" });
  mock.method(console, "log", () => {});

  const result = await sendEmail({ to: "a@b.test", subject: "s", text: "t" });

  assert.equal(result.mode, "log");
  assert.equal(result.delivered, true);
});

test("an unset EMAIL_MODE still defaults to log", async (t) => {
  withEnv(t, { EMAIL_MODE: "" });
  mock.method(console, "log", () => {});

  assert.equal((await sendEmail({ to: "a@b.test", subject: "s", text: "t" })).mode, "log");
});

test("send mode still throws — Resend remains unwired", async (t) => {
  withEnv(t, { EMAIL_MODE: "send" });

  await assert.rejects(
    () => sendEmail({ to: "a@b.test", subject: "s", text: "t" }),
    /not implemented/,
  );
});
