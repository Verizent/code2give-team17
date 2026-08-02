const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const signupsRepo = require("../../../src/data/volunteer-signups.repo");
const opportunitiesRepo = require("../../../src/data/volunteer-opportunities.repo");
const badgesService = require("../../../src/services/admin/badges.service");
const thankYouService = require("../../../src/services/email/thank-you.service");
const attendanceService = require("../../../src/services/admin/attendance.service");

const OPP_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const attendedRow = (id, thankYouSent = null) => ({
  id,
  volunteer_id: `vol-${id}`,
  hours_logged: 2,
  status: "attended",
  thank_you_email_sent_at: thankYouSent,
  volunteers: {
    id: `vol-${id}`,
    email: `${id}@example.com`,
    full_name: `Volunteer ${id}`,
    locale: "en",
  },
  volunteer_opportunities: {
    id: OPP_ID,
    title_en: "Weekend Class Assistant",
    title_zh: "周末課堂助理",
    programme: "sports",
  },
});

function stubHappyPath() {
  mock.method(badgesService, "awardAfterAttendance", async () => []);
  mock.method(opportunitiesRepo, "listOpen", async () => ({
    rows: [
      { id: "rec-1", title_en: "Fitness A", title_zh: "健身A", starts_at: "2026-09-01T00:00:00.000Z" },
    ],
    total: 1,
  }));
}

test("sends a thank-you per unique signup and marks thank_you_email_sent_at", async (t) => {
  mock.method(signupsRepo, "markAttendance", async (id, patch) => attendedRow(id, null));
  stubHappyPath();
  const sendThankYou = mock.fn(async () => ({ demo_preview: true }));
  mock.method(thankYouService, "sendThankYou", sendThankYou);
  const markThankYouSent = mock.fn(async () => undefined);
  mock.method(signupsRepo, "markThankYouSent", markThankYouSent);
  t.after(() => mock.restoreAll());

  const result = await attendanceService.markAttendance(OPP_ID, [
    { id: "sig-a", hours_logged: 2, status: "attended" },
    { id: "sig-b", hours_logged: 3, status: "attended" },
  ]);

  assert.equal(sendThankYou.mock.calls.length, 2, "one email per signup");
  assert.equal(markThankYouSent.mock.calls.length, 2);
  assert.deepEqual(
    markThankYouSent.mock.calls.map((call) => call.arguments[0]).sort(),
    ["sig-a", "sig-b"],
  );
  assert.equal(result.thank_you_emails_sent, 2);
});

test("skips send when the signup already carries thank_you_email_sent_at", async (t) => {
  mock.method(signupsRepo, "markAttendance", async (id) =>
    attendedRow(id, id === "sig-a" ? "2026-08-01T00:00:00.000Z" : null),
  );
  stubHappyPath();
  const sendThankYou = mock.fn(async () => ({ demo_preview: true }));
  mock.method(thankYouService, "sendThankYou", sendThankYou);
  const markThankYouSent = mock.fn(async () => undefined);
  mock.method(signupsRepo, "markThankYouSent", markThankYouSent);
  t.after(() => mock.restoreAll());

  const result = await attendanceService.markAttendance(OPP_ID, [
    { id: "sig-a", hours_logged: 2, status: "attended" },
    { id: "sig-b", hours_logged: 3, status: "attended" },
  ]);

  assert.equal(sendThankYou.mock.calls.length, 1);
  assert.equal(sendThankYou.mock.calls[0].arguments[0].volunteer.email, "sig-b@example.com");
  assert.equal(result.thank_you_emails_sent, 1);
});

test("skips send for no_show attendance", async (t) => {
  mock.method(signupsRepo, "markAttendance", async (id) => ({
    ...attendedRow(id, null),
    status: "no_show",
  }));
  stubHappyPath();
  const sendThankYou = mock.fn(async () => ({ demo_preview: true }));
  mock.method(thankYouService, "sendThankYou", sendThankYou);
  const markThankYouSent = mock.fn(async () => undefined);
  mock.method(signupsRepo, "markThankYouSent", markThankYouSent);
  t.after(() => mock.restoreAll());

  const result = await attendanceService.markAttendance(OPP_ID, [
    { id: "sig-c", hours_logged: 0, status: "no_show" },
  ]);

  assert.equal(sendThankYou.mock.calls.length, 0);
  assert.equal(result.thank_you_emails_sent, 0);
});

test("email failure is logged but does not throw or block badge award", async (t) => {
  mock.method(signupsRepo, "markAttendance", async (id) => attendedRow(id, null));
  stubHappyPath();
  mock.method(thankYouService, "sendThankYou", async () => {
    throw new Error("resend down");
  });
  const markThankYouSent = mock.fn(async () => undefined);
  mock.method(signupsRepo, "markThankYouSent", markThankYouSent);
  t.after(() => mock.restoreAll());

  // Suppress the expected console.error for cleaner test output.
  const originalError = console.error;
  console.error = () => {};
  t.after(() => { console.error = originalError; });

  const result = await attendanceService.markAttendance(OPP_ID, [
    { id: "sig-a", hours_logged: 2, status: "attended" },
  ]);

  assert.equal(markThankYouSent.mock.calls.length, 0, "no stamp on failed send");
  assert.equal(result.thank_you_emails_sent, 0);
  assert.equal(result.signups.length, 1, "signup update still surfaced to caller");
});
