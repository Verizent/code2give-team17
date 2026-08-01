const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const signupsRepo = require("../../../src/data/signups.repo");
const opportunitiesRepo = require("../../../src/data/opportunities.repo");
const badgesService = require("../../../src/services/volunteering/badges.service");
const { markAttendance } = require("../../../src/services/admin/attendance.service");

test("markAttendance sets attended and evaluates badges", async (t) => {
  mock.method(signupsRepo, "findById", async () => ({
    id: "s1",
    opportunity_id: "o1",
    volunteer_id: "v1",
    status: "confirmed",
    hours_logged: 0,
  }));
  mock.method(opportunitiesRepo, "findById", async () => ({
    id: "o1",
    starts_at: "2026-08-01T02:00:00.000Z",
    ends_at: "2026-08-01T03:30:00.000Z",
  }));
  mock.method(signupsRepo, "markAttended", async (_id, opts) => {
    assert.equal(opts.hours_logged, 1.5);
    return {
      id: "s1",
      volunteer_id: "v1",
      status: "attended",
      hours_logged: 1.5,
    };
  });
  mock.method(badgesService, "evaluateForVolunteer", async () => ["first_session"]);
  t.after(() => mock.restoreAll());

  const result = await markAttendance("s1", {});
  assert.equal(result.signup.status, "attended");
  assert.deepEqual(result.badges_awarded, ["first_session"]);
});

test("markAttendance is idempotent when already attended", async (t) => {
  mock.method(signupsRepo, "findById", async () => ({
    id: "s1",
    status: "attended",
    volunteer_id: "v1",
  }));
  t.after(() => mock.restoreAll());

  const result = await markAttendance("s1", {});
  assert.equal(result.signup.status, "attended");
  assert.deepEqual(result.badges_awarded, []);
});
