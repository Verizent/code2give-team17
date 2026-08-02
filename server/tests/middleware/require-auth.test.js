const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const authenticate = require("../../src/services/auth/authenticate");
const { ApiError } = require("../../src/lib/api-error");
const { requireAuth, optionalAuth } = require("../../src/middleware/require-auth");

/** Captures whatever the middleware hands to next(). */
function nextSpy() {
  const calls = [];
  const next = (error) => calls.push(error);
  next.calls = calls;
  return next;
}

function stubResolve(t, implementation) {
  mock.method(authenticate, "resolveAuth", implementation);
  t.after(() => mock.restoreAll());
}

test("requireAuth refuses a request carrying no Authorization header", async () => {
  // Deliberately unstubbed: resolveAuth must reject before it ever reaches Supabase.
  const request = { headers: {} };
  const next = nextSpy();

  await requireAuth(request, {}, next);

  assert.equal(next.calls[0]?.status, 401);
  assert.equal(request.auth, undefined);
});

test("requireAuth refuses a header whose scheme is not Bearer", async () => {
  const next = nextSpy();

  await requireAuth({ headers: { authorization: "Basic dXNlcjpwYXNz" } }, {}, next);

  assert.equal(next.calls[0]?.status, 401);
});

test("requireAuth admits a valid token and leaves request.auth populated", async (t) => {
  stubResolve(t, async (request) => {
    request.auth = Object.freeze({ userId: "u1", role: "volunteer" });
    return request.auth;
  });
  const request = { headers: { authorization: "Bearer good" } };
  const next = nextSpy();

  await requireAuth(request, {}, next);

  assert.deepEqual(next.calls, [undefined]);
  assert.equal(request.auth.role, "volunteer");
});

test("requireAuth passes a 503 through as 503 rather than reporting it as 401", async (t) => {
  stubResolve(t, async () => {
    throw new ApiError(503, "Authentication provider is unreachable");
  });
  const next = nextSpy();

  await requireAuth({ headers: { authorization: "Bearer good" } }, {}, next);

  // Collapsing this to 401 would tell every signed-in user their session expired
  // because Supabase blinked.
  assert.equal(next.calls[0]?.status, 503);
});

test("optionalAuth serves an anonymous visitor without an error", async () => {
  const request = { headers: {} };
  const next = nextSpy();

  await optionalAuth(request, {}, next);

  assert.deepEqual(next.calls, [undefined]);
  assert.equal(request.auth, undefined);
});

test("optionalAuth serves a visitor holding an expired token", async (t) => {
  stubResolve(t, async () => {
    throw ApiError.unauthenticated();
  });
  const request = { headers: { authorization: "Bearer expired" } };
  const next = nextSpy();

  await optionalAuth(request, {}, next);

  // A stale token in a browser tab must not break a page the same visitor could
  // have seen while signed out.
  assert.deepEqual(next.calls, [undefined]);
  assert.equal(request.auth, undefined);
});

test("optionalAuth still serves the page when Supabase is unreachable", async (t) => {
  stubResolve(t, async () => {
    throw new ApiError(503, "Authentication provider is unreachable");
  });
  const next = nextSpy();

  await optionalAuth({ headers: { authorization: "Bearer good" } }, {}, next);

  // An auth outage must not take down public content that merely personalises.
  assert.deepEqual(next.calls, [undefined]);
});

test("optionalAuth populates request.auth when the token is good", async (t) => {
  stubResolve(t, async (request) => {
    request.auth = Object.freeze({ userId: "u1", role: "admin" });
    return request.auth;
  });
  const request = { headers: { authorization: "Bearer good" } };
  const next = nextSpy();

  await optionalAuth(request, {}, next);

  assert.deepEqual(next.calls, [undefined]);
  assert.equal(request.auth.role, "admin");
});
