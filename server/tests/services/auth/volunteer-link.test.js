const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const volunteerLinksRepo = require("../../../src/data/volunteer-links.repo");
const {
  linkVolunteerToProfile,
} = require("../../../src/services/auth/volunteer-link.service");

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_PROFILE_ID = "22222222-2222-4222-8222-222222222222";

test("links an unclaimed volunteer matching the verified email", async (t) => {
  mock.method(volunteerLinksRepo, "claimByEmail", async () => ({
    id: "vol-1",
    email: "bob@example.com",
    profile_id: PROFILE_ID,
  }));
  t.after(() => mock.restoreAll());

  const result = await linkVolunteerToProfile({
    profileId: PROFILE_ID,
    email: "bob@example.com",
  });

  assert.equal(result.linked, true);
  assert.equal(result.volunteer.id, "vol-1");
});

test("normalises the email before looking the volunteer up", async (t) => {
  let received;
  mock.method(volunteerLinksRepo, "claimByEmail", async (args) => {
    received = args;
    return { id: "vol-1" };
  });
  t.after(() => mock.restoreAll());

  await linkVolunteerToProfile({ profileId: PROFILE_ID, email: "  Bob@Example.COM " });

  // volunteers.email is stored normalised. Querying the raw value matches nothing
  // and is indistinguishable from "this person never volunteered".
  assert.equal(received.email, "bob@example.com");
});

test("reports no_volunteer when the address has never volunteered", async (t) => {
  mock.method(volunteerLinksRepo, "claimByEmail", async () => null);
  mock.method(volunteerLinksRepo, "findByEmail", async () => null);
  t.after(() => mock.restoreAll());

  const result = await linkVolunteerToProfile({
    profileId: PROFILE_ID,
    email: "admin@example.com",
  });

  // Not an error. Every admin, and every account holder who never volunteered,
  // lands here on their first authenticated request.
  assert.equal(result.linked, false);
  assert.equal(result.reason, "no_volunteer");
});

test("is idempotent when the row is already claimed by the same profile", async (t) => {
  mock.method(volunteerLinksRepo, "claimByEmail", async () => null);
  mock.method(volunteerLinksRepo, "findByEmail", async () => ({
    id: "vol-1",
    profile_id: PROFILE_ID,
  }));
  t.after(() => mock.restoreAll());

  const result = await linkVolunteerToProfile({
    profileId: PROFILE_ID,
    email: "bob@example.com",
  });

  // The conditional UPDATE matches zero rows on a second call. That is success,
  // not failure — this runs on every first-request path and must not throw.
  assert.equal(result.linked, true);
});

test("refuses to steal a row already claimed by a different profile", async (t) => {
  mock.method(volunteerLinksRepo, "claimByEmail", async () => null);
  mock.method(volunteerLinksRepo, "findByEmail", async () => ({
    id: "vol-1",
    profile_id: OTHER_PROFILE_ID,
  }));
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => linkVolunteerToProfile({ profileId: PROFILE_ID, email: "bob@example.com" }),
    (error) => {
      assert.equal(error.status, 409);
      return true;
    },
  );
});

test("rejects a missing email rather than querying for a null address", async (t) => {
  const claim = mock.method(volunteerLinksRepo, "claimByEmail", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(() =>
    linkVolunteerToProfile({ profileId: PROFILE_ID, email: null }),
  );

  assert.equal(claim.mock.callCount(), 0);
});
