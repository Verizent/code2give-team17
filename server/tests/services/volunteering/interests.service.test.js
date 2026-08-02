const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const volunteersRepo = require("../../../src/data/volunteers.repo");
const emailLib = require("../../../src/lib/email");
const interestsService = require("../../../src/services/volunteering/interests.service");

const VOLUNTEER = {
  id: "33333333-3333-4333-8333-333333333333",
  email: "ops@acme.test",
  full_name: "Dana Ops",
};

/**
 * registerProgrammeInterest is the no-opportunity_id path: the volunteer hub's general
 * signup form and the organisation enquiry panel both land here. It used to resolve a
 * volunteer and return `interest: null`, dropping the message and the organisation — the
 * only two fields that make an enquiry actionable. volunteer_interests cannot hold these
 * rows (opportunity_id is NOT NULL), so the enquiry is emailed to staff instead.
 */
test("registerProgrammeInterest emails the enquiry to staff", async (t) => {
  process.env.ENQUIRY_TO = "hello@love21.test";
  mock.method(volunteersRepo, "findByEmail", async () => VOLUNTEER);
  const sendEmail = mock.fn(async () => ({ mode: "smtp", delivered: true, id: "<x>" }));
  mock.method(emailLib, "sendEmail", sendEmail);
  t.after(() => {
    delete process.env.ENQUIRY_TO;
    mock.restoreAll();
  });

  const result = await interestsService.registerProgrammeInterest({
    email: "ops@acme.test",
    full_name: "Dana Ops",
    phone: "91234567",
    organisation: "Acme Corp",
    message: "We have 20 staff free on Saturdays.",
  });

  assert.equal(sendEmail.mock.callCount(), 1);
  const [message] = sendEmail.mock.calls[0].arguments;
  assert.equal(message.to, "hello@love21.test");
  assert.equal(message.subject, "ENQUIRY FROM Dana Ops <ops@acme.test> — Acme Corp");
  assert.match(message.text, /Organisation:\s+Acme Corp/);
  assert.match(message.text, /Name:\s+Dana Ops/);
  assert.match(message.text, /Email:\s+ops@acme\.test/);
  assert.match(message.text, /Phone:\s+91234567/);
  assert.match(message.text, /We have 20 staff free on Saturdays\./);

  assert.equal(result.delivered, true);
  assert.equal(result.volunteer.id, VOLUNTEER.id);
  assert.equal(result.opportunity, null);
});

test("registerProgrammeInterest omits the organisation from the subject when absent", async (t) => {
  mock.method(volunteersRepo, "findByEmail", async () => VOLUNTEER);
  const sendEmail = mock.fn(async () => ({ mode: "log", delivered: true }));
  mock.method(emailLib, "sendEmail", sendEmail);
  t.after(() => mock.restoreAll());

  await interestsService.registerProgrammeInterest({
    email: "ops@acme.test",
    full_name: "Dana Ops",
    message: "Interested in weekend classes.",
  });

  const [message] = sendEmail.mock.calls[0].arguments;
  assert.equal(message.subject, "ENQUIRY FROM Dana Ops <ops@acme.test>");
  assert.match(message.text, /Organisation:\s+—/);
});

test("registerProgrammeInterest creates the volunteer when the email is new", async (t) => {
  mock.method(volunteersRepo, "findByEmail", async () => null);
  const createVolunteer = mock.fn(async (values) => ({ id: "new-vol", ...values }));
  mock.method(volunteersRepo, "createVolunteer", createVolunteer);
  mock.method(emailLib, "sendEmail", async () => ({ mode: "log", delivered: true }));
  t.after(() => mock.restoreAll());

  const result = await interestsService.registerProgrammeInterest({
    email: "New.Lead@Acme.test",
    full_name: "New Lead",
  });

  assert.equal(createVolunteer.mock.callCount(), 1);
  assert.equal(createVolunteer.mock.calls[0].arguments[0].email, "new.lead@acme.test");
  assert.equal(result.volunteer.id, "new-vol");
});

/**
 * The contact row is the durable half of this: even if the mail server is down, the
 * lead's email and name are still on `volunteers`, so the enquiry is recoverable. A send
 * failure must therefore not lose the contact — but it must not claim success either.
 */
test("registerProgrammeInterest reports delivered:false when the send fails", async (t) => {
  mock.method(volunteersRepo, "findByEmail", async () => VOLUNTEER);
  mock.method(emailLib, "sendEmail", async () => {
    throw new Error("535 auth failed");
  });
  t.after(() => mock.restoreAll());

  const result = await interestsService.registerProgrammeInterest({
    email: "ops@acme.test",
    full_name: "Dana Ops",
    message: "Anyone there?",
  });

  assert.equal(result.delivered, false);
  assert.equal(result.volunteer.id, VOLUNTEER.id);
});
