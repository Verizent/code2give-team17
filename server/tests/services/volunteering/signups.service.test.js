const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const volunteersRepo = require("../../../src/data/volunteers.repo");
const signupsRepo = require("../../../src/data/signups.repo");
const opportunitiesRepo = require("../../../src/data/opportunities.repo");
const interestsRepo = require("../../../src/data/interests.repo");
const {
  createSignup,
  getVolunteerMe,
  cancelSignup,
} = require("../../../src/services/volunteering/signups.service");

const opportunity = {
  id: "a1111111-1111-4111-8111-111111111111",
  title_en: "K-pop",
  title_zh: null,
  description_en: "Dance",
  description_zh: null,
  location_en: "HK",
  location_zh: null,
  programme: "sports",
  starts_at: "2026-08-15T02:00:00.000Z",
  ends_at: "2026-08-15T03:30:00.000Z",
  capacity: 2,
  spots_filled: 0,
  min_age: 16,
  skills: [],
  status: "open",
  source: "internal",
  handson_url: null,
  handson_opportunity_id: null,
  last_synced_at: null,
};

const volunteer = {
  id: "b2222222-2222-4222-8222-222222222222",
  email: "ada@example.com",
  full_name: "Ada",
  phone: null,
  locale: "en",
  profile_id: null,
  claimed_at: null,
};

test("createSignup claims a spot and returns confirmed signup", async (t) => {
  mock.method(signupsRepo, "claimSpot", async () => ({
    ok: true,
    opportunity: { ...opportunity, spots_filled: 1 },
  }));
  mock.method(opportunitiesRepo, "findOpenById", async () => opportunity);
  mock.method(volunteersRepo, "findByEmail", async () => null);
  mock.method(volunteersRepo, "insert", async () => volunteer);
  mock.method(signupsRepo, "insert", async () => ({
    id: "c3333333-3333-4333-8333-333333333333",
    opportunity_id: opportunity.id,
    volunteer_id: volunteer.id,
    status: "confirmed",
  }));
  t.after(() => mock.restoreAll());

  const result = await createSignup(
    {
      opportunity_id: opportunity.id,
      full_name: "Ada",
      email: "Ada@Example.com",
    },
    null,
  );

  assert.equal(result.signup.status, "confirmed");
  assert.equal(result.volunteer.email, "ada@example.com");
});

test("createSignup 409s when full", async (t) => {
  mock.method(signupsRepo, "claimSpot", async () => ({
    ok: false,
    opportunity: { ...opportunity, spots_filled: 2, status: "full" },
  }));
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () =>
      createSignup(
        {
          opportunity_id: opportunity.id,
          full_name: "Ada",
          email: "ada@example.com",
        },
        null,
      ),
    (err) => err.status === 409,
  );
});

test("createSignup 404s when opportunity missing", async (t) => {
  mock.method(signupsRepo, "claimSpot", async () => ({ ok: false }));
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () =>
      createSignup(
        {
          opportunity_id: opportunity.id,
          full_name: "Ada",
          email: "ada@example.com",
        },
        null,
      ),
    (err) => err.status === 404,
  );
});

test("getVolunteerMe claims email-matched volunteer to profile", async (t) => {
  mock.method(volunteersRepo, "findByProfileId", async () => null);
  mock.method(volunteersRepo, "findByEmail", async () => volunteer);
  mock.method(volunteersRepo, "claim", async () => ({
    ...volunteer,
    profile_id: "user-1",
    claimed_at: "2026-08-01T00:00:00.000Z",
  }));
  mock.method(signupsRepo, "listByVolunteerId", async () => []);
  mock.method(interestsRepo, "listByVolunteerId", async () => []);
  t.after(() => mock.restoreAll());

  const me = await getVolunteerMe({ id: "user-1", email: "ada@example.com" });
  assert.equal(me.volunteer.profile_id, "user-1");
  assert.equal(me.stats.session_count, 0);
  assert.equal(me.stats.interest_count, 0);
  assert.deepEqual(me.interests, []);
});

test("cancelSignup forbids other volunteers", async (t) => {
  mock.method(signupsRepo, "findById", async () => ({
    id: "c3333333-3333-4333-8333-333333333333",
    volunteer_id: volunteer.id,
    opportunity_id: opportunity.id,
    status: "confirmed",
  }));
  mock.method(volunteersRepo, "findByProfileId", async () => ({
    ...volunteer,
    id: "other",
  }));
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => cancelSignup("c3333333-3333-4333-8333-333333333333", { id: "user-1" }),
    (err) => err.status === 403,
  );
});
