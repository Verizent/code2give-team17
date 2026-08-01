const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const badgesRepo = require("../../../src/data/badges.repo");
const signupsRepo = require("../../../src/data/volunteer-signups.repo");
const badgesService = require("../../../src/services/admin/badges.service");

const VOLUNTEER_ID = "11111111-1111-1111-1111-111111111111";

const CATALOG = [
  { id: "b-first-signup", code: "first_signup", criteria_type: "signup_count", threshold: 1 },
  { id: "b-getting-started", code: "getting_started", criteria_type: "hours", threshold: 10 },
  { id: "b-programme-explorer", code: "programme_explorer", criteria_type: "programme_variety", threshold: 3 },
];

function attendedSignup(programme, hours) {
  return {
    id: `s-${programme}-${hours}`,
    volunteer_id: VOLUNTEER_ID,
    status: "attended",
    hours_logged: hours,
    volunteer_opportunities: { programme },
  };
}

test("awards the signup_count badge once the volunteer has any attended signup", async (t) => {
  mock.method(badgesRepo, "listAllBadges", async () => CATALOG);
  mock.method(signupsRepo, "listAttendedForVolunteer", async () => [
    attendedSignup("sports", 2),
  ]);
  mock.method(badgesRepo, "listEarnedBadgeIdsForVolunteer", async () => new Set());
  const insertVolunteerBadges = mock.fn(async () => undefined);
  mock.method(badgesRepo, "insertVolunteerBadges", insertVolunteerBadges);
  t.after(() => mock.restoreAll());

  const awarded = await badgesService.awardAfterAttendance(VOLUNTEER_ID);

  assert.deepEqual(awarded, ["b-first-signup"]);
  const rows = insertVolunteerBadges.mock.calls[0].arguments[0];
  assert.deepEqual(rows, [{ volunteer_id: VOLUNTEER_ID, badge_id: "b-first-signup" }]);
});

test("hours badge fires when the sum of attended hours crosses the threshold", async (t) => {
  mock.method(badgesRepo, "listAllBadges", async () => CATALOG);
  mock.method(signupsRepo, "listAttendedForVolunteer", async () => [
    attendedSignup("sports", 4),
    attendedSignup("fitness", 6),
  ]);
  mock.method(badgesRepo, "listEarnedBadgeIdsForVolunteer", async () => new Set(["b-first-signup"]));
  const insertVolunteerBadges = mock.fn(async () => undefined);
  mock.method(badgesRepo, "insertVolunteerBadges", insertVolunteerBadges);
  t.after(() => mock.restoreAll());

  const awarded = await badgesService.awardAfterAttendance(VOLUNTEER_ID);

  assert.deepEqual(awarded, ["b-getting-started"]);
  const rows = insertVolunteerBadges.mock.calls[0].arguments[0];
  assert.equal(rows.length, 1);
  assert.equal(rows[0].badge_id, "b-getting-started");
});

test("programme_variety counts distinct programmes, not signup count", async (t) => {
  mock.method(badgesRepo, "listAllBadges", async () => CATALOG);
  mock.method(signupsRepo, "listAttendedForVolunteer", async () => [
    attendedSignup("sports", 1),
    attendedSignup("sports", 1),
    attendedSignup("fitness", 1),
    attendedSignup("nutrition", 1),
  ]);
  mock.method(badgesRepo, "listEarnedBadgeIdsForVolunteer", async () => new Set(["b-first-signup"]));
  const insertVolunteerBadges = mock.fn(async () => undefined);
  mock.method(badgesRepo, "insertVolunteerBadges", insertVolunteerBadges);
  t.after(() => mock.restoreAll());

  const awarded = await badgesService.awardAfterAttendance(VOLUNTEER_ID);

  assert.deepEqual(awarded, ["b-programme-explorer"]);
});

test("does not re-award badges the volunteer already has", async (t) => {
  mock.method(badgesRepo, "listAllBadges", async () => CATALOG);
  mock.method(signupsRepo, "listAttendedForVolunteer", async () => [
    attendedSignup("sports", 12),
  ]);
  mock.method(
    badgesRepo,
    "listEarnedBadgeIdsForVolunteer",
    async () => new Set(["b-first-signup", "b-getting-started"]),
  );
  const insertVolunteerBadges = mock.fn(async () => undefined);
  mock.method(badgesRepo, "insertVolunteerBadges", insertVolunteerBadges);
  t.after(() => mock.restoreAll());

  const awarded = await badgesService.awardAfterAttendance(VOLUNTEER_ID);

  assert.deepEqual(awarded, []);
  assert.equal(insertVolunteerBadges.mock.calls.length, 0);
});

test("skips the insert call entirely when there is nothing to award", async (t) => {
  mock.method(badgesRepo, "listAllBadges", async () => CATALOG);
  mock.method(signupsRepo, "listAttendedForVolunteer", async () => []);
  mock.method(badgesRepo, "listEarnedBadgeIdsForVolunteer", async () => new Set());
  const insertVolunteerBadges = mock.fn(async () => undefined);
  mock.method(badgesRepo, "insertVolunteerBadges", insertVolunteerBadges);
  t.after(() => mock.restoreAll());

  const awarded = await badgesService.awardAfterAttendance(VOLUNTEER_ID);

  assert.deepEqual(awarded, []);
  assert.equal(insertVolunteerBadges.mock.calls.length, 0);
});
