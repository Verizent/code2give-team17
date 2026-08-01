const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const opportunitiesRepo = require("../../../src/data/opportunities.repo");
const interestsRepo = require("../../../src/data/interests.repo");
const signupsService = require("../../../src/services/volunteering/signups.service");
const { registerInterest } = require("../../../src/services/volunteering/interests.service");

const opportunity = {
  id: "a1111111-1111-4111-8111-111111111111",
  title_en: "K-pop",
  title_zh: null,
  description_en: null,
  description_zh: null,
  location_en: null,
  location_zh: null,
  programme: "sports",
  starts_at: "2026-08-15T02:00:00.000Z",
  ends_at: null,
  capacity: 1,
  spots_filled: 0,
  min_age: 16,
  skills: [],
  status: "open",
  source: "handson",
  handson_url: "https://example.com",
  handson_opportunity_id: "x",
  last_synced_at: null,
};

test("registerInterest creates a lead without bumping spots_filled", async (t) => {
  mock.method(opportunitiesRepo, "findOpenById", async () => opportunity);
  mock.method(signupsService, "resolveVolunteer", async () => ({
    id: "v1",
    email: "lead@example.com",
    full_name: "Lead",
  }));
  mock.method(interestsRepo, "insert", async (input) => ({
    id: "i1",
    opportunity_id: input.opportunity_id,
    volunteer_id: input.volunteer_id,
    message: input.message,
    created_at: "2026-08-01T00:00:00.000Z",
  }));
  mock.method(
    interestsRepo,
    "countByOpportunityIds",
    async () => new Map([[opportunity.id, 1]]),
  );
  t.after(() => mock.restoreAll());

  const result = await registerInterest(
    opportunity.id,
    {
      full_name: "Lead",
      email: "lead@example.com",
      message: "Happy to help",
    },
    null,
  );

  assert.equal(result.interest.id, "i1");
  assert.equal(result.opportunity.interested_count, 1);
  assert.equal(result.opportunity.spots_filled, 0);
});

test("registerInterest 404s when listing missing", async (t) => {
  mock.method(opportunitiesRepo, "findOpenById", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () =>
      registerInterest(
        opportunity.id,
        { full_name: "Lead", email: "lead@example.com" },
        null,
      ),
    (error) => {
      assert.equal(error.status, 404);
      return true;
    },
  );
});
