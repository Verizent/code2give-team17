const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const signupsRepo = require("../../../src/data/volunteer-signups.repo");
const feedbackService = require("../../../src/services/volunteering/signup-feedback.service");

const SIGNUP_ID = "22222222-2222-4222-8222-222222222222";

const attendedSignup = () => ({
  id: SIGNUP_ID,
  volunteer_id: "vol-1",
  status: "attended",
  feedback_submitted_at: null,
  discovery_source: null,
});

const notAttendedSignup = () => ({
  id: SIGNUP_ID,
  volunteer_id: "vol-1",
  status: "confirmed",
  feedback_submitted_at: null,
  discovery_source: null,
});

test("patchSignup 404s an unknown signup id", async (t) => {
  mock.method(signupsRepo, "findSignupById", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => feedbackService.patchSignup(SIGNUP_ID, { discovery_source: "social" }),
    (error) => {
      assert.equal(error.status, 404);
      return true;
    },
  );
});

test("patchSignup accepts discovery fields on a non-attended signup", async (t) => {
  mock.method(signupsRepo, "findSignupById", async () => notAttendedSignup());
  const patchSignupFields = mock.fn(async (id, patch) => ({
    id,
    volunteer_id: "vol-1",
    ...patch,
  }));
  mock.method(signupsRepo, "patchSignupFields", patchSignupFields);
  t.after(() => mock.restoreAll());

  const result = await feedbackService.patchSignup(SIGNUP_ID, {
    discovery_source: "social",
    signup_motivation: "friend was going",
  });

  assert.equal(patchSignupFields.mock.calls.length, 1);
  const patch = patchSignupFields.mock.calls[0].arguments[1];
  assert.equal(patch.discovery_source, "social");
  assert.equal(patch.signup_motivation, "friend was going");
  assert.equal(patch.feedback_submitted_at, undefined, "feedback stamp not set for discovery-only body");
  assert.equal(result.discovery_source, "social");
});

test("patchSignup 400s when a feedback field arrives before attended", async (t) => {
  mock.method(signupsRepo, "findSignupById", async () => notAttendedSignup());
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => feedbackService.patchSignup(SIGNUP_ID, { experience_rating: 5 }),
    (error) => {
      assert.equal(error.status, 400);
      return true;
    },
  );
});

test("patchSignup stamps feedback_submitted_at when a feedback field is included and signup is attended", async (t) => {
  mock.method(signupsRepo, "findSignupById", async () => attendedSignup());
  const patchSignupFields = mock.fn(async (id, patch) => ({
    id,
    volunteer_id: "vol-1",
    ...patch,
  }));
  mock.method(signupsRepo, "patchSignupFields", patchSignupFields);
  t.after(() => mock.restoreAll());

  const result = await feedbackService.patchSignup(SIGNUP_ID, {
    experience_rating: 5,
    would_return: true,
  });

  const patch = patchSignupFields.mock.calls[0].arguments[1];
  assert.equal(patch.experience_rating, 5);
  assert.equal(patch.would_return, true);
  assert.ok(patch.feedback_submitted_at, "server-side timestamp stamped");
  assert.ok(result.feedback_submitted_at);
});

test("patchSignup does not re-stamp feedback_submitted_at when discovery-only fields arrive after attended", async (t) => {
  mock.method(signupsRepo, "findSignupById", async () => attendedSignup());
  const patchSignupFields = mock.fn(async (id, patch) => ({
    id,
    volunteer_id: "vol-1",
    ...patch,
  }));
  mock.method(signupsRepo, "patchSignupFields", patchSignupFields);
  t.after(() => mock.restoreAll());

  await feedbackService.patchSignup(SIGNUP_ID, {
    discovery_source: "employer_csr",
  });

  const patch = patchSignupFields.mock.calls[0].arguments[1];
  assert.equal(patch.feedback_submitted_at, undefined);
});
