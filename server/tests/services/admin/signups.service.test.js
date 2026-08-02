const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const signupsRepo = require("../../../src/data/volunteer-signups.repo");
const adminSignupsService = require("../../../src/services/admin/signups.service");

const OPP_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const roster = [
  {
    id: "s1",
    volunteer_id: "v1",
    status: "attended",
    hours_logged: 3,
    discovery_source: "social",
    experience_rating: 5,
    would_return: true,
    improvement_note: null,
    feedback_submitted_at: "2026-08-02T11:00:00.000Z",
    thank_you_email_sent_at: "2026-08-02T10:30:00.000Z",
    volunteers: { id: "v1", email: "a@ex.com", full_name: "A", locale: "en" },
  },
  {
    id: "s2",
    volunteer_id: "v2",
    status: "attended",
    hours_logged: 2,
    discovery_source: "friend_colleague",
    experience_rating: 4,
    would_return: true,
    improvement_note: "shorter warm-up",
    feedback_submitted_at: "2026-08-02T11:05:00.000Z",
    thank_you_email_sent_at: null,
    volunteers: { id: "v2", email: "b@ex.com", full_name: "B", locale: "zh-Hant" },
  },
  {
    id: "s3",
    volunteer_id: "v3",
    status: "no_show",
    hours_logged: 0,
    discovery_source: "social",
    experience_rating: null,
    would_return: null,
    improvement_note: null,
    feedback_submitted_at: null,
    thank_you_email_sent_at: null,
    volunteers: { id: "v3", email: "c@ex.com", full_name: "C", locale: "en" },
  },
];

test("listRosterForOpportunity returns every signup with joined volunteer info and §23 fields", async (t) => {
  const listByOpportunity = mock.fn(async () => roster);
  mock.method(signupsRepo, "listByOpportunity", listByOpportunity);
  t.after(() => mock.restoreAll());

  const result = await adminSignupsService.listRosterForOpportunity(OPP_ID);

  assert.equal(listByOpportunity.mock.calls.length, 1);
  assert.equal(listByOpportunity.mock.calls[0].arguments[0], OPP_ID);
  assert.equal(result.length, 3);
  assert.equal(result[0].discovery_source, "social");
  assert.equal(result[0].volunteer.email, "a@ex.com");
  assert.equal(result[0].experience_rating, 5);
});

test("summariseFeedback averages attended ratings and reports would_return percentage", async (t) => {
  mock.method(signupsRepo, "listByOpportunity", async () => roster);
  t.after(() => mock.restoreAll());

  const summary = await adminSignupsService.summariseFeedback(OPP_ID);

  assert.equal(summary.attended_count, 2, "no_show excluded from attended stats");
  assert.equal(summary.no_show_count, 1);
  assert.equal(summary.feedback_submitted_count, 2);
  assert.equal(summary.average_rating, 4.5);
  assert.equal(summary.would_return_percent, 100);
  assert.deepEqual(summary.discovery_breakdown, {
    social: 2,
    friend_colleague: 1,
  });
});

test("summariseFeedback handles zero attended (avoids divide-by-zero)", async (t) => {
  mock.method(signupsRepo, "listByOpportunity", async () => [
    { ...roster[2] },
  ]);
  t.after(() => mock.restoreAll());

  const summary = await adminSignupsService.summariseFeedback(OPP_ID);

  assert.equal(summary.attended_count, 0);
  assert.equal(summary.average_rating, null, "null rather than NaN when no ratings");
  assert.equal(summary.would_return_percent, null);
});

test("summariseFeedback returns empty structure when the opportunity has no signups", async (t) => {
  mock.method(signupsRepo, "listByOpportunity", async () => []);
  t.after(() => mock.restoreAll());

  const summary = await adminSignupsService.summariseFeedback(OPP_ID);

  assert.equal(summary.attended_count, 0);
  assert.equal(summary.total_signups, 0);
  assert.deepEqual(summary.discovery_breakdown, {});
  assert.equal(summary.average_rating, null);
});
