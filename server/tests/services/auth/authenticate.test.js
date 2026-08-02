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

test("provisions with a normalised email", async (t) => {
  // profiles.email is NOT NULL and carries check (email = lower(btrim(email))).
  // Omitting it fails the insert outright; sending it raw fails the constraint.
  stubAll(t, {
    token: { ...hostileToken(), email: "  Bob@Example.COM " },
    profile: null,
  });

  await resolveAuth(requestWith("Bearer abc.def.ghi"));

  const inserted = profilesRepo.insertIfAbsent.mock.calls[0].arguments[0];
  assert.equal(inserted.email, "bob@example.com");
});

test("provisions with an empty email when the account has none", async (t) => {
  stubAll(t, { token: { ...hostileToken(), email: null }, profile: null });

  await resolveAuth(requestWith("Bearer abc.def.ghi"));

  // Mirrors handle_new_user's coalesce(new.email, ''): the column is NOT NULL, so
  // null is not an option, and '' satisfies the normalisation check.
  const inserted = profilesRepo.insertIfAbsent.mock.calls[0].arguments[0];
  assert.equal(inserted.email, "");
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

test("links the volunteer for a user whose profile already exists", async (t) => {
  // The case that actually happens. `on_auth_user_created` creates the profiles row
  // at signup, so by the time any request arrives findById always finds one. Tying
  // the link to first-provision means it never runs for anybody, and nothing fails
  // loudly — the volunteer simply stays unlinked forever.
  stubAll(t, { profile: { id: USER_ID, role: "volunteer", full_name: "Bob" } });

  await resolveAuth(requestWith("Bearer abc.def.ghi"));

  assert.equal(volunteerLinkService.linkVolunteerToProfile.mock.callCount(), 1);
});

test("does not re-attempt the link when the token was served from cache", async (t) => {
  stubAll(t, {
    token: { ...hostileToken(), fromCache: true },
    profile: { id: USER_ID, role: "volunteer" },
  });

  await resolveAuth(requestWith("Bearer abc.def.ghi"));

  // The 60s token cache is the throttle. Without this the claim UPDATE would run on
  // every authenticated request for the life of the account.
  assert.equal(volunteerLinkService.linkVolunteerToProfile.mock.callCount(), 0);
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

// -----------------------------------------------------------------------------
// DEMO-ONLY: env-gated + header-opt-in identity bypass for the demo. Real deploys
// reject this three ways (NODE_ENV, missing env, missing header). See §19.
// -----------------------------------------------------------------------------

const DEMO_ADMIN_UUID = "22222222-2222-4222-8222-222222222222";
const DEMO_ADMIN_PROFILE = {
  id: DEMO_ADMIN_UUID,
  role: "admin",
  email: "demo-admin@love21.local",
  full_name: "Demo Admin",
  locale: "en",
};

function setEnv(t, values) {
  const originals = {};
  for (const [key, value] of Object.entries(values)) {
    originals[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  t.after(() => {
    for (const [key, original] of Object.entries(originals)) {
      if (original === undefined) delete process.env[key];
      else process.env[key] = original;
    }
  });
}

function bypassRequest(extraHeaders = {}) {
  return { headers: { "x-demo-auth": "admin", ...extraHeaders } };
}

test("demo bypass: env + header + NODE_ENV=development resolves the seeded admin profile", async (t) => {
  setEnv(t, { NODE_ENV: "development", DEMO_ADMIN_USER_ID: DEMO_ADMIN_UUID });
  mock.method(profilesRepo, "findById", async (id) => (id === DEMO_ADMIN_UUID ? DEMO_ADMIN_PROFILE : null));
  mock.method(verifyToken, "verifySupabaseToken", async () => {
    throw new Error("verifyToken must not be called on the bypass path");
  });
  t.after(() => mock.restoreAll());

  const request = bypassRequest();
  await resolveAuth(request);

  assert.equal(request.auth.role, "admin");
  assert.equal(request.auth.userId, DEMO_ADMIN_UUID);
  assert.equal(request.auth.email, DEMO_ADMIN_PROFILE.email);
  assert.equal(verifyToken.verifySupabaseToken.mock.callCount(), 0);
});

test("demo bypass: rejected when NODE_ENV is production even with env + header set", async (t) => {
  setEnv(t, { NODE_ENV: "production", DEMO_ADMIN_USER_ID: DEMO_ADMIN_UUID });
  stubAll(t, { profile: DEMO_ADMIN_PROFILE });

  // No Authorization header — bypass is refused, bearer parse fails, we 401.
  await assert.rejects(
    () => resolveAuth(bypassRequest()),
    (error) => error.status === 401,
  );
});

test("demo bypass: rejected when the X-Demo-Auth header is absent", async (t) => {
  setEnv(t, { NODE_ENV: "development", DEMO_ADMIN_USER_ID: DEMO_ADMIN_UUID });
  stubAll(t, { profile: DEMO_ADMIN_PROFILE });

  await assert.rejects(
    () => resolveAuth(requestWith(undefined)),
    (error) => error.status === 401,
  );
});

test("demo bypass: throws 500 when DEMO_ADMIN_USER_ID points at a non-existent profile", async (t) => {
  setEnv(t, { NODE_ENV: "development", DEMO_ADMIN_USER_ID: DEMO_ADMIN_UUID });
  mock.method(profilesRepo, "findById", async () => null);
  mock.method(verifyToken, "verifySupabaseToken", async () => hostileToken());
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => resolveAuth(bypassRequest()),
    (error) => error.status === 500,
  );
});

test("demo bypass: short-circuits before verifyToken.verifySupabaseToken runs", async (t) => {
  // Prove ordering: even if there IS an Authorization header, the bypass path must
  // not fall through to bearer parsing. Otherwise a misconfigured demo could
  // accidentally exercise a broken bearer path and mask the misconfiguration.
  setEnv(t, { NODE_ENV: "development", DEMO_ADMIN_USER_ID: DEMO_ADMIN_UUID });
  mock.method(profilesRepo, "findById", async () => DEMO_ADMIN_PROFILE);
  mock.method(verifyToken, "verifySupabaseToken", async () => {
    throw new Error("bypass must not reach verifyToken");
  });
  t.after(() => mock.restoreAll());

  const request = bypassRequest({ authorization: "Bearer whatever" });
  await resolveAuth(request);

  assert.equal(request.auth.role, "admin");
  assert.equal(verifyToken.verifySupabaseToken.mock.callCount(), 0);
});
