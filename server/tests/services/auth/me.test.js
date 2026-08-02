const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const volunteerLinksRepo = require("../../../src/data/volunteer-links.repo");
const { getMe } = require("../../../src/services/auth/me.service");

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_PROFILE_ID = "22222222-2222-4222-8222-222222222222";

/** Mirrors the frozen object `resolveAuth` puts on the request. */
function authFor(overrides = {}) {
  return Object.freeze({
    userId: PROFILE_ID,
    email: "bob@example.com",
    role: "volunteer",
    profile: {
      id: PROFILE_ID,
      role: "volunteer",
      full_name: "Bob Chan",
      locale: "en",
      ...overrides.profile,
    },
    ...overrides,
  });
}

test("returns the identity the profile row describes", async (t) => {
  mock.method(volunteerLinksRepo, "findByEmail", async () => null);
  t.after(() => mock.restoreAll());

  const me = await getMe(authFor());

  assert.equal(me.userId, PROFILE_ID);
  assert.equal(me.email, "bob@example.com");
  assert.equal(me.role, "volunteer");
  assert.equal(me.fullName, "Bob Chan");
  assert.equal(me.locale, "en");
});

test("reports the role stored on the profile, never one implied by the caller", async (t) => {
  mock.method(volunteerLinksRepo, "findByEmail", async () => null);
  t.after(() => mock.restoreAll());

  // The whole point of /api/me: the browser cannot read its own role from the JWT,
  // because role deliberately lives in profiles. This endpoint is the only source.
  const me = await getMe(authFor({ role: "admin", profile: { role: "admin" } }));

  assert.equal(me.role, "admin");
});

test("reports the linked volunteer when the row points at this profile", async (t) => {
  mock.method(volunteerLinksRepo, "findByEmail", async () => ({
    id: "vol-1",
    email: "bob@example.com",
    full_name: "Bob Chan",
    profile_id: PROFILE_ID,
    claimed_at: "2026-07-30T00:00:00.000Z",
  }));
  t.after(() => mock.restoreAll());

  const me = await getMe(authFor());

  assert.equal(me.volunteer.linked, true);
  assert.equal(me.volunteer.id, "vol-1");
  assert.equal(me.volunteer.claimedAt, "2026-07-30T00:00:00.000Z");
});

test("reports linked:false when the address has never volunteered", async (t) => {
  mock.method(volunteerLinksRepo, "findByEmail", async () => null);
  t.after(() => mock.restoreAll());

  const me = await getMe(authFor());

  // Every admin is in this state. It is not an error and must not throw.
  assert.equal(me.volunteer.linked, false);
});

test("does not expose a volunteer row belonging to a different profile", async (t) => {
  mock.method(volunteerLinksRepo, "findByEmail", async () => ({
    id: "vol-1",
    email: "bob@example.com",
    full_name: "Someone Else",
    profile_id: OTHER_PROFILE_ID,
    claimed_at: "2026-07-30T00:00:00.000Z",
  }));
  t.after(() => mock.restoreAll());

  const me = await getMe(authFor());

  // Matching on email alone would hand this caller another person's name and
  // claim date. The profile_id has to agree before anything is returned.
  assert.equal(me.volunteer.linked, false);
  assert.equal(JSON.stringify(me).includes("Someone Else"), false);
});

test("never serialises a volunteer access_token", async (t) => {
  mock.method(volunteerLinksRepo, "findByEmail", async () => ({
    id: "vol-1",
    profile_id: PROFILE_ID,
    claimed_at: "2026-07-30T00:00:00.000Z",
    access_token: "tok_must_never_leave_the_server",
  }));
  t.after(() => mock.restoreAll());

  const me = await getMe(authFor());

  // LINK_COLUMNS already excludes it, so this guards the other direction:
  // that the service builds its result field by field instead of spreading the row.
  assert.equal(JSON.stringify(me).includes("tok_must_never_leave_the_server"), false);
});

test("does not query for a volunteer when the account has no email", async (t) => {
  const findByEmail = mock.method(volunteerLinksRepo, "findByEmail", async () => null);
  t.after(() => mock.restoreAll());

  const me = await getMe(authFor({ email: null }));

  // normaliseEmail throws on null, and a lookup for a null address could only ever
  // match nothing. Skip it rather than let /api/me 500 for that account.
  assert.equal(findByEmail.mock.callCount(), 0);
  assert.equal(me.volunteer.linked, false);
});

test("normalises the email before looking up the volunteer link", async (t) => {
  let received;
  mock.method(volunteerLinksRepo, "findByEmail", async (email) => {
    received = email;
    return null;
  });
  t.after(() => mock.restoreAll());

  await getMe(authFor({ email: "  Bob@Example.COM " }));

  assert.equal(received, "bob@example.com");
});
