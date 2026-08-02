const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const emailLib = require("../../../src/lib/email");
const thankYou = require("../../../src/services/email/thank-you.service");

const VOLUNTEER = {
  id: "vol-1",
  email: "alex@example.com",
  full_name: "Alex Chan",
  locale: "en",
};

const SIGNUP = {
  id: "sig-1",
  hours_logged: 3,
  attended_at: "2026-08-02T10:00:00.000Z",
};

const OPPORTUNITY = {
  id: "opp-1",
  title_en: "Weekend Class Assistant",
  title_zh: "周末課堂助理",
  programme: "sports",
};

const RECOMMENDATIONS = [
  {
    id: "opp-2",
    title_en: "Fitness Programme Assistant",
    title_zh: "健身計劃助理",
    starts_at: "2026-08-16T02:00:00.000Z",
  },
  {
    id: "opp-3",
    title_en: "Nutrition Workshop Support",
    title_zh: "營養工作坊支援",
    starts_at: "2026-08-23T02:00:00.000Z",
  },
];

test("returns the rendered payload with volunteer, hours, and recommendations", async (t) => {
  mock.method(emailLib, "sendEmail", async () => ({ mode: "log", delivered: true }));
  t.after(() => mock.restoreAll());
  const result = await thankYou.sendThankYou({
    volunteer: VOLUNTEER,
    signup: SIGNUP,
    opportunity: OPPORTUNITY,
    recommendations: RECOMMENDATIONS,
  });

  assert.equal(result.to, VOLUNTEER.email);
  assert.ok(result.subject.length > 0);
  assert.ok(result.text.includes("Alex Chan"));
  assert.ok(result.text.includes("Weekend Class Assistant"), "opportunity title in body");
  assert.ok(result.text.includes("3"), "hours logged appear in body");
  assert.ok(
    result.text.includes("/me?tab=volunteer&feedback=sig-1"),
    "feedback deep link includes signup id",
  );
  assert.ok(
    result.text.includes("Fitness Programme Assistant"),
    "first recommendation appears",
  );
  assert.equal(result.recommendations.length, 2);
});

test("respects the volunteer's locale — zh-Hant picks the Chinese title", async (t) => {
  mock.method(emailLib, "sendEmail", async () => ({ mode: "log", delivered: true }));
  t.after(() => mock.restoreAll());
  const result = await thankYou.sendThankYou({
    volunteer: { ...VOLUNTEER, locale: "zh-Hant" },
    signup: SIGNUP,
    opportunity: OPPORTUNITY,
    recommendations: RECOMMENDATIONS,
  });

  assert.ok(result.text.includes("周末課堂助理"), "Chinese title used for zh-Hant");
  assert.ok(!result.text.includes("Weekend Class Assistant"), "English title omitted");
});

test("falls back to English when the zh-Hant title is empty", async (t) => {
  mock.method(emailLib, "sendEmail", async () => ({ mode: "log", delivered: true }));
  t.after(() => mock.restoreAll());
  const result = await thankYou.sendThankYou({
    volunteer: { ...VOLUNTEER, locale: "zh-Hant" },
    signup: SIGNUP,
    opportunity: { ...OPPORTUNITY, title_zh: null },
    recommendations: [],
  });

  assert.ok(result.text.includes("Weekend Class Assistant"), "falls back per field");
});

/**
 * This service used to carry its own private EMAIL_MODE switch: `live` threw, `console`
 * logged, and everything else silently returned a payload without sending. server/.env
 * carries EMAIL_MODE=smtp, which matched neither branch — so the one email a volunteer is
 * actually promised was rendered and dropped on the floor, and nothing failed to say so.
 * It now goes through lib/email like every other send.
 */
test("hands the rendered email to the shared sender", async (t) => {
  const sendEmail = mock.fn(async () => ({ mode: "smtp", delivered: true, id: "<m>" }));
  mock.method(emailLib, "sendEmail", sendEmail);
  t.after(() => mock.restoreAll());

  const result = await thankYou.sendThankYou({
    volunteer: VOLUNTEER,
    signup: SIGNUP,
    opportunity: OPPORTUNITY,
    recommendations: RECOMMENDATIONS,
  });

  assert.equal(sendEmail.mock.callCount(), 1);
  const [message] = sendEmail.mock.calls[0].arguments;
  assert.equal(message.to, VOLUNTEER.email);
  assert.ok(message.subject.length > 0);
  assert.ok(message.text.includes("Alex Chan"));
  assert.equal(result.delivered, true);
});

/**
 * The attendance write and the badge award have already happened by this point, and
 * markAttendance only stamps thank_you_email_sent_at on success — so a failure must
 * surface rather than be reported as sent, or the retry never happens.
 */
test("propagates a send failure instead of reporting the email as sent", async (t) => {
  mock.method(emailLib, "sendEmail", async () => {
    throw new Error("535 auth failed");
  });
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () =>
      thankYou.sendThankYou({
        volunteer: VOLUNTEER,
        signup: SIGNUP,
        opportunity: OPPORTUNITY,
        recommendations: [],
      }),
    /535/,
  );
});

test("400s when the volunteer has no email address", async () => {
  await assert.rejects(
    () =>
      thankYou.sendThankYou({
        volunteer: { ...VOLUNTEER, email: null },
        signup: SIGNUP,
        opportunity: OPPORTUNITY,
        recommendations: [],
      }),
    (error) => {
      assert.equal(error.status, 400);
      return true;
    },
  );
});
