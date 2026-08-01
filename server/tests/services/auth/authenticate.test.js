const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const verifyToken = require("../../../src/services/auth/verify-token");
const profilesRepo = require("../../../src/data/profiles.repo");
const volunteerLinkService = require("../../../src/services/auth/volunteer-link.service");
const { resolveAuth } = require("../../../src/services/auth/authenticate");

const USER_ID = "11111111-1111-4111-8111-111111111111";

function requestWith(header) {
  return { headers: header === undefined ? {} : { authorization: header } };
}

/** A verified token whose metadata claims admin. The metadata is attacker-controlled. */
function hostileToken() {
  return {
    userId: USER_ID,
    email: "attacker@example.com",
    emailConfirmedAt: "2026-08-01T00:00:00Z",
    fullName: "Attacker",
    userMetadata: { role: "admin", is_admin: true },
  };
}

function stubAll(t, { token = hostileToken(), profile } = {}) {
  mock.method(verifyToken, "verifySupabaseToken", async () => token);
  mock.method(profilesRepo, "findById", async () => profile ?? null);
  // Mirrors the real repo, which injects role itself and ignores any role in input.
  mock.method(profilesRepo, "insertIfAbsent", async (row) => ({
    ...row,
    role: "volunteer",
  }));
  mock.method(volunteerLinkService, "linkVolunteerToProfile", async () => ({
    linked: false,
    reason: "no_volunteer",
  }));
  t.after(() => mock.restoreAll());
}

test("a token claiming role=admin in its metadata still resolves as volunteer", async (t) => {
  // THE escalation guard. Supabase lets any client pass arbitrary user_metadata at
  // signUp(). If that value ever reaches profiles.role, admin becomes self-serve.
  stubAll(t, { profile: { id: USER_ID, role: "volunteer", full_name: "Attacker" } });

  const request = requestWith("Bearer abc.def.ghi");
  await resolveAuth(request);

  assert.equal(request.auth.role, "volunteer");
});

test("provisions a missing profile as volunteer, ignoring hostile metadata", async (t) => {
  stubAll(t, { profile: null });
  const request = requestWith("Bearer abc.def.ghi");

  await resolveAuth(request);

  // The provisioning call must not carry a role at all — the repo hardcodes it.
  // If a role ever appears in this payload it came from somewhere, and the only
  // "somewhere" available is attacker-controlled token metadata.
  const inserted = profilesRepo.insertIfAbsent.mock.calls[0].arguments[0];
  assert.equal(inserted.role, undefined);
  assert.equal(request.auth.role, "volunteer");
});

test("reads role from the profile row, not the token", async (t) => {
  stubAll(t, {
    token: { ...hostileToken(), userMetadata: { role: "volunteer" } },
    profile: { id: USER_ID, role: "admin", full_name: "Real Admin" },
  });

  const request = requestWith("Bearer abc.def.ghi");
  await resolveAuth(request);

  assert.equal(request.auth.role, "admin");
});

test("never exposes raw token metadata on request.auth", async (t) => {
  stubAll(t, { profile: { id: USER_ID, role: "volunteer" } });
  const request = requestWith("Bearer abc.def.ghi");

  await resolveAuth(request);

  // The moment user_metadata is reachable from a route, somebody writes
  // request.auth.user_metadata.role.
  assert.equal(request.auth.userMetadata, undefined);
  assert.equal(request.auth.token, undefined);
  assert.deepEqual(Object.keys(request.auth).sort(), ["email", "profile", "role", "userId"]);
});

test("freezes request.auth", async (t) => {
  stubAll(t, { profile: { id: USER_ID, role: "volunteer" } });
  const request = requestWith("Bearer abc.def.ghi");

  await resolveAuth(request);

  assert.equal(Object.isFrozen(request.auth), true);
});

test("rejects a missing Authorization header with 401", async (t) => {
  stubAll(t, { profile: { id: USER_ID, role: "volunteer" } });

  await assert.rejects(
    () => resolveAuth(requestWith(undefined)),
    (error) => error.status === 401,
  );
});

test("rejects a non-Bearer scheme with 401", async (t) => {
  stubAll(t, { profile: { id: USER_ID, role: "volunteer" } });

  await assert.rejects(
    () => resolveAuth(requestWith("Basic dXNlcjpwYXNz")),
    (error) => error.status === 401,
  );
});

test("accepts a lower-case bearer scheme", async (t) => {
  stubAll(t, { profile: { id: USER_ID, role: "volunteer" } });
  const request = requestWith("bearer abc.def.ghi");

  await resolveAuth(request);

  assert.equal(request.auth.userId, USER_ID);
});

test("is idempotent — a second call does not re-verify the token", async (t) => {
  stubAll(t, { profile: { id: USER_ID, role: "volunteer" } });
  const request = requestWith("Bearer abc.def.ghi");

  await resolveAuth(request);
  await resolveAuth(request);

  // requireAuth and requireRole both call this. Re-verifying would double the
  // network round-trips on every admin request.
  assert.equal(verifyToken.verifySupabaseToken.mock.callCount(), 1);
});

test("does not attempt a volunteer link when the email is unconfirmed", async (t) => {
  // profile: null so this IS a first provision — the only thing that may stop the
  // link is the unconfirmed email. With an existing profile the test would pass
  // even if the guard were missing.
  stubAll(t, {
    token: { ...hostileToken(), emailConfirmedAt: null },
    profile: null,
  });

  await resolveAuth(requestWith("Bearer abc.def.ghi"));

  // Without this guard, signing up with a known volunteer's address is enough to
  // inherit their hours, badges and contact details.
  assert.equal(volunteerLinkService.linkVolunteerToProfile.mock.callCount(), 0);
});

test("links the volunteer when the email is confirmed", async (t) => {
  stubAll(t, { profile: null });

  await resolveAuth(requestWith("Bearer abc.def.ghi"));

  assert.equal(volunteerLinkService.linkVolunteerToProfile.mock.callCount(), 1);
});

test("a 409 from claim linking does not block authentication", async (t) => {
  stubAll(t, { profile: null });
  volunteerLinkService.linkVolunteerToProfile.mock.mockImplementation(async () => {
    const error = new Error("already linked");
    error.status = 409;
    throw error;
  });

  const request = requestWith("Bearer abc.def.ghi");
  await resolveAuth(request);

  // An admin whose address happens to collide with a claimed volunteer row must
  // still be able to log in and moderate.
  assert.equal(request.auth.role, "volunteer");
});
