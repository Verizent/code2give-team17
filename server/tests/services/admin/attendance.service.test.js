const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const signupsRepo = require("../../../src/data/volunteer-signups.repo");
const badgesService = require("../../../src/services/admin/badges.service");
const attendanceService = require("../../../src/services/admin/attendance.service");

const OPPORTUNITY_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const SIGNUP_A = "sig-a";
const SIGNUP_B = "sig-b";
const VOLUNTEER_A = "vol-a";
const VOLUNTEER_B = "vol-b";

test("marks each signup attended, writes hours_logged, and calls badges service once per unique volunteer", async (t) => {
  const markAttendance = mock.fn(async (id, patch) => ({
    id,
    volunteer_id: id === SIGNUP_A ? VOLUNTEER_A : VOLUNTEER_B,
    hours_logged: patch.hours_logged,
    status: patch.status,
    attended_at: patch.attended_at,
  }));
  mock.method(signupsRepo, "markAttendance", markAttendance);
  const awardAfter = mock.fn(async () => []);
  mock.method(badgesService, "awardAfterAttendance", awardAfter);
  t.after(() => mock.restoreAll());

  await attendanceService.markAttendance(OPPORTUNITY_ID, [
    { id: SIGNUP_A, hours_logged: 3, status: "attended" },
    { id: SIGNUP_B, hours_logged: 3, status: "attended" },
  ]);

  assert.equal(markAttendance.mock.calls.length, 2);
  const firstCall = markAttendance.mock.calls[0].arguments;
  assert.equal(firstCall[0], SIGNUP_A);
  assert.equal(firstCall[1].hours_logged, 3);
  assert.equal(firstCall[1].status, "attended");
  assert.ok(firstCall[1].attended_at, "attended_at is set server-side");

  assert.equal(awardAfter.mock.calls.length, 2);
  assert.deepEqual(
    awardAfter.mock.calls.map((call) => call.arguments[0]).sort(),
    [VOLUNTEER_A, VOLUNTEER_B].sort(),
  );
});

test("dedupes badge evaluation when the same volunteer appears twice in the batch", async (t) => {
  const markAttendance = mock.fn(async (id, patch) => ({
    id,
    volunteer_id: VOLUNTEER_A,
    hours_logged: patch.hours_logged,
    status: patch.status,
  }));
  mock.method(signupsRepo, "markAttendance", markAttendance);
  const awardAfter = mock.fn(async () => []);
  mock.method(badgesService, "awardAfterAttendance", awardAfter);
  t.after(() => mock.restoreAll());

  await attendanceService.markAttendance(OPPORTUNITY_ID, [
    { id: SIGNUP_A, hours_logged: 2, status: "attended" },
    { id: SIGNUP_B, hours_logged: 3, status: "attended" },
  ]);

  assert.equal(awardAfter.mock.calls.length, 1);
  assert.equal(awardAfter.mock.calls[0].arguments[0], VOLUNTEER_A);
});

test("returns the updated signups plus a map of newly-awarded badges keyed by volunteer id", async (t) => {
  mock.method(signupsRepo, "markAttendance", async (id, patch) => ({
    id,
    volunteer_id: id === SIGNUP_A ? VOLUNTEER_A : VOLUNTEER_B,
    hours_logged: patch.hours_logged,
    status: patch.status,
  }));
  mock.method(badgesService, "awardAfterAttendance", async (volunteerId) =>
    volunteerId === VOLUNTEER_A ? ["b-first-signup"] : [],
  );
  t.after(() => mock.restoreAll());

  const result = await attendanceService.markAttendance(OPPORTUNITY_ID, [
    { id: SIGNUP_A, hours_logged: 2, status: "attended" },
    { id: SIGNUP_B, hours_logged: 3, status: "attended" },
  ]);

  assert.equal(result.signups.length, 2);
  assert.deepEqual(result.awarded_badges_by_volunteer, {
    [VOLUNTEER_A]: ["b-first-signup"],
  });
});
