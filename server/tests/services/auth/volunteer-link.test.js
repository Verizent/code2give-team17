const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const volunteerLinksRepo = require("../../../src/data/volunteer-links.repo");
const {
  linkVolunteerToProfile,
} = require("../../../src/services/auth/volunteer-link.service");

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_PROFILE_ID = "22222222-2222-4222-8222-222222222222";

test("links an unclaimed volunteer matching the verified email", async (t) => {
  mock.method(volunteerLinksRepo, "findByEmail", async () => ({
    id: "vol-1",
    email: "bob@example.com",
    profile_id: null,
  }));
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
  let lookedUp;
  let claimedWith;
  mock.method(volunteerLinksRepo, "findByEmail", async (value) => {
    lookedUp = value;
    return { id: "vol-1", profile_id: null };
  });
  mock.method(volunteerLinksRepo, "claimByEmail", async (args) => {
    claimedWith = args;
    return { id: "vol-1" };
  });
  t.after(() => mock.restoreAll());

  await linkVolunteerToProfile({ profileId: PROFILE_ID, email: "  Bob@Example.COM " });

  // volunteers.email is stored normalised. Querying the raw value matches nothing
  // and is indistinguishable from "this person never volunteered" — so both the read
  // that decides and the write that claims have to go through normaliseEmail.
  assert.equal(lookedUp, "bob@example.com");
  assert.equal(claimedWith.email, "bob@example.com");
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
  const claim = mock.method(volunteerLinksRepo, "claimByEmail", async () => null);
  mock.method(volunteerLinksRepo, "findByEmail", async () => ({
    id: "vol-1",
    profile_id: PROFILE_ID,
  }));
  t.after(() => mock.restoreAll());

  const result = await linkVolunteerToProfile({
    profileId: PROFILE_ID,
    email: "bob@example.com",
  });

  // Settled state, and it must not throw — this runs on every cache miss.
  assert.equal(result.linked, true);

  // THE POINT OF THE READ-FIRST ORDER. `authenticate.js` re-attempts the link on
  // every token-cache expiry, which is once a minute for as long as somebody keeps
  // using the site. Writing first meant a no-op UPDATE plus a SELECT, forever, to
  // re-derive a state that became final the first time.
  assert.equal(claim.mock.callCount(), 0);
});

test("does not write when the address has never volunteered", async (t) => {
  const claim = mock.method(volunteerLinksRepo, "claimByEmail", async () => null);
  mock.method(volunteerLinksRepo, "findByEmail", async () => null);
  t.after(() => mock.restoreAll());

  await linkVolunteerToProfile({ profileId: PROFILE_ID, email: "admin@example.com" });

  // Every admin, and everyone who never volunteered, takes this path on every cache
  // miss. An UPDATE that can only ever match zero rows does not belong on it.
  assert.equal(claim.mock.callCount(), 0);
});

test("does not write when the row is already claimed by a different profile", async (t) => {
  const claim = mock.method(volunteerLinksRepo, "claimByEmail", async () => null);
  mock.method(volunteerLinksRepo, "findByEmail", async () => ({
    id: "vol-1",
    profile_id: OTHER_PROFILE_ID,
  }));
  t.after(() => mock.restoreAll());

  await assert.rejects(() =>
    linkVolunteerToProfile({ profileId: PROFILE_ID, email: "bob@example.com" }),
  );

  assert.equal(claim.mock.callCount(), 0);
});

test("refuses the row when a concurrent claim wins between the read and the write", async (t) => {
  // The read said unclaimed; by the time the UPDATE ran, `.is(profile_id, null)`
  // matched nothing. Reading first narrows this window but cannot close it, which is
  // why the conditional UPDATE stays the actual concurrency guard.
  mock.method(volunteerLinksRepo, "findByEmail", async () => ({
    id: "vol-1",
    profile_id: null,
  }));
  mock.method(volunteerLinksRepo, "claimByEmail", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => linkVolunteerToProfile({ profileId: PROFILE_ID, email: "bob@example.com" }),
    (error) => {
      assert.equal(error.status, 409);
      return true;
    },
  );
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
