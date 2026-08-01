const { test } = require("node:test");
const assert = require("node:assert/strict");

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

test("console mode returns a rendered payload with volunteer, hours, and recommendations", async () => {
  process.env.EMAIL_MODE = "console";
  const result = await thankYou.sendThankYou({
    volunteer: VOLUNTEER,
    signup: SIGNUP,
    opportunity: OPPORTUNITY,
    recommendations: RECOMMENDATIONS,
  });

  assert.equal(result.demo_preview, true, "console mode flags demo_preview:true");
  assert.equal(result.to, VOLUNTEER.email);
  assert.ok(result.subject.length > 0);
  assert.ok(result.text.includes("Alex Chan"));
  assert.ok(result.text.includes("Weekend Class Assistant"), "opportunity title in body");
  assert.ok(result.text.includes("3"), "hours logged appear in body");
  assert.ok(
    result.text.includes("Fitness Programme Assistant"),
    "first recommendation appears",
  );
  assert.equal(result.recommendations.length, 2);
});

test("respects the volunteer's locale — zh-Hant picks the Chinese title", async () => {
  process.env.EMAIL_MODE = "console";
  const result = await thankYou.sendThankYou({
    volunteer: { ...VOLUNTEER, locale: "zh-Hant" },
    signup: SIGNUP,
    opportunity: OPPORTUNITY,
    recommendations: RECOMMENDATIONS,
  });

  assert.ok(result.text.includes("周末課堂助理"), "Chinese title used for zh-Hant");
  assert.ok(!result.text.includes("Weekend Class Assistant"), "English title omitted");
});

test("falls back to English when the zh-Hant title is empty", async () => {
  process.env.EMAIL_MODE = "console";
  const result = await thankYou.sendThankYou({
    volunteer: { ...VOLUNTEER, locale: "zh-Hant" },
    signup: SIGNUP,
    opportunity: { ...OPPORTUNITY, title_zh: null },
    recommendations: [],
  });

  assert.ok(result.text.includes("Weekend Class Assistant"), "falls back per field");
});

test("live mode throws — real integration is not implemented", async () => {
  process.env.EMAIL_MODE = "live";
  await assert.rejects(
    () =>
      thankYou.sendThankYou({
        volunteer: VOLUNTEER,
        signup: SIGNUP,
        opportunity: OPPORTUNITY,
        recommendations: [],
      }),
    (error) => {
      assert.equal(error.status, 400);
      return true;
    },
  );
  process.env.EMAIL_MODE = "console";
});

test("400s when the volunteer has no email address", async () => {
  process.env.EMAIL_MODE = "console";
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
