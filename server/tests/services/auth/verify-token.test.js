const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const supabaseConfig = require("../../../src/config/supabase");
const { verifySupabaseToken } = require("../../../src/services/auth/verify-token");

/**
 * The token->user cache is module-level state that outlives a single test, so every
 * test uses its own token string. Sharing one would let an earlier test's cached
 * result satisfy a later assertion and hide a real regression.
 */
function stubGetUser(implementation) {
  const getUser = mock.fn(implementation);
  mock.method(supabaseConfig, "getServiceClient", () => ({ auth: { getUser } }));
  return getUser;
}

function validUser(overrides = {}) {
  return {
    data: {
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "bob@example.com",
        email_confirmed_at: "2026-07-30T00:00:00.000Z",
        user_metadata: { full_name: "Bob Chan" },
        ...overrides,
      },
    },
    error: null,
  };
}

test("returns the trusted fields for a valid token", async (t) => {
  stubGetUser(async () => validUser());
  t.after(() => mock.restoreAll());

  const result = await verifySupabaseToken("tok-valid");

  assert.equal(result.userId, "11111111-1111-4111-8111-111111111111");
  assert.equal(result.email, "bob@example.com");
  assert.equal(result.emailConfirmedAt, "2026-07-30T00:00:00.000Z");
  assert.equal(result.fullName, "Bob Chan");
});

test("rejects with 401 when Supabase rejects the token", async (t) => {
  stubGetUser(async () => ({ data: null, error: { status: 401 } }));
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => verifySupabaseToken("tok-4xx"),
    (error) => {
      assert.equal(error.status, 401);
      return true;
    },
  );
});

test("answers 503, not 401, when Supabase itself fails", async (t) => {
  stubGetUser(async () => ({ data: null, error: { status: 500 } }));
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => verifySupabaseToken("tok-5xx"),
    (error) => {
      // 401 here would sign every user out because the auth provider blinked.
      assert.equal(error.status, 503);
      return true;
    },
  );
});

test("answers 503 when the call to Supabase throws", async (t) => {
  stubGetUser(async () => {
    throw new Error("getaddrinfo ENOTFOUND");
  });
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => verifySupabaseToken("tok-network"),
    (error) => {
      assert.equal(error.status, 503);
      return true;
    },
  );
});

test("treats a revoked token, which resolves { user: null, error: null }, as 401", async (t) => {
  stubGetUser(async () => ({ data: { user: null }, error: null }));
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => verifySupabaseToken("tok-revoked"),
    (error) => {
      // Checking only `error` would let a revoked token straight through.
      assert.equal(error.status, 401);
      return true;
    },
  );
});

test("rejects a token carrying no subject", async (t) => {
  stubGetUser(async () => ({ data: { user: { email: "x@example.com" } }, error: null }));
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => verifySupabaseToken("tok-no-sub"),
    (error) => {
      // The service-role key is itself a valid JWT with no `sub`.
      assert.equal(error.status, 401);
      return true;
    },
  );
});

test("never lets a raw Supabase error code reach the response envelope", async (t) => {
  stubGetUser(async () => ({
    data: null,
    error: { status: 403, code: "bad_jwt", name: "AuthApiError" },
  }));
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => verifySupabaseToken("tok-bad-jwt"),
    (error) => {
      // error-handler.js emits `error.code` verbatim, so "bad_jwt" would ship a
      // non-§29 code to the client.
      assert.equal(error.code, "UNAUTHENTICATED");
      assert.notEqual(error.code, "bad_jwt");
      return true;
    },
  );
});

test("serves a repeated token from cache instead of calling Supabase again", async (t) => {
  const getUser = stubGetUser(async () => validUser());
  t.after(() => mock.restoreAll());

  await verifySupabaseToken("tok-cached");
  await verifySupabaseToken("tok-cached");

  assert.equal(getUser.mock.callCount(), 1);
});

test("does not cache a rejection", async (t) => {
  const getUser = stubGetUser(async () => ({ data: null, error: { status: 401 } }));
  t.after(() => mock.restoreAll());

  await assert.rejects(() => verifySupabaseToken("tok-uncached-failure"));
  await assert.rejects(() => verifySupabaseToken("tok-uncached-failure"));

  // A token rejected once must be re-checked: caching the failure would keep a
  // user locked out for the TTL after the real cause cleared.
  assert.equal(getUser.mock.callCount(), 2);
});

test("re-checks a token once its cache entry has expired", async (t) => {
  t.mock.timers.enable({ apis: ["Date"] });
  const getUser = stubGetUser(async () => validUser());
  t.after(() => mock.restoreAll());

  await verifySupabaseToken("tok-expiring");
  t.mock.timers.tick(61_000);
  await verifySupabaseToken("tok-expiring");

  // A 60s TTL is what lets `update profiles set role='admin'` take effect without
  // a restart. If entries never expired, a revoked token would live forever.
  assert.equal(getUser.mock.callCount(), 2);
});
