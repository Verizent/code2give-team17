const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const authenticate = require("../../src/services/auth/authenticate");
const { requireRole } = require("../../src/middleware/require-role");
const { requireAuth } = require("../../src/middleware/require-auth");

/** Captures whatever the middleware hands to next(). */
function nextSpy() {
  const calls = [];
  const next = (error) => calls.push(error);
  next.calls = calls;
  return next;
}

function stubResolve(t, auth) {
  mock.method(authenticate, "resolveAuth", async (request) => {
    request.auth = Object.freeze(auth);
    return request.auth;
  });
  t.after(() => mock.restoreAll());
}

test("admin passes requireRole('admin')", async (t) => {
  stubResolve(t, { userId: "u1", role: "admin" });
  const next = nextSpy();

  await requireRole("admin")({ headers: {} }, {}, next);

  assert.deepEqual(next.calls, [undefined]);
});

test("volunteer is refused by requireRole('admin') with 403", async (t) => {
  stubResolve(t, { userId: "u1", role: "volunteer" });
  const next = nextSpy();

  await requireRole("admin")({ headers: {} }, {}, next);

  assert.equal(next.calls[0]?.status, 403);
});

test("requireRole resolves auth itself rather than trusting request.auth", async (t) => {
  // THE failure that matters. If requireRole assumed requireAuth had already run,
  // mounting it alone would leave request.auth undefined — and the defensive fix
  // people reach for, `if (request.auth && !allowed.has(role))`, is an admin route
  // that is silently wide open.
  stubResolve(t, { userId: "u1", role: "volunteer" });
  const next = nextSpy();

  await requireRole("admin")({ headers: {} }, {}, next);

  assert.equal(authenticate.resolveAuth.mock.callCount(), 1);
  assert.equal(next.calls[0]?.status, 403, "must refuse, not fall through");
});

test("an unauthenticated caller gets 401 from requireRole, not 403", async (t) => {
  mock.method(authenticate, "resolveAuth", async () => {
    const error = new Error("no token");
    error.status = 401;
    throw error;
  });
  t.after(() => mock.restoreAll());
  const next = nextSpy();

  await requireRole("admin")({ headers: {} }, {}, next);

  assert.equal(next.calls[0]?.status, 401);
});

test("requireRole accepts any of several roles", async (t) => {
  stubResolve(t, { userId: "u1", role: "volunteer" });
  const next = nextSpy();

  await requireRole("admin", "volunteer")({ headers: {} }, {}, next);

  assert.deepEqual(next.calls, [undefined]);
});

test("requireAuth passes any authenticated role through", async (t) => {
  stubResolve(t, { userId: "u1", role: "volunteer" });
  const next = nextSpy();

  await requireAuth({ headers: {} }, {}, next);

  assert.deepEqual(next.calls, [undefined]);
});

test("requireAuth forwards a 401 to the error handler rather than throwing", async (t) => {
  mock.method(authenticate, "resolveAuth", async () => {
    const error = new Error("no token");
    error.status = 401;
    throw error;
  });
  t.after(() => mock.restoreAll());
  const next = nextSpy();

  // Express 5 does not treat a synchronous throw from middleware the same way it
  // treats one from a route handler. Middleware must call next(error).
  await requireAuth({ headers: {} }, {}, next);

  assert.equal(next.calls[0]?.status, 401);
});

test("a role absent from the profile is refused, never defaulted", async (t) => {
  stubResolve(t, { userId: "u1", role: undefined });
  const next = nextSpy();

  await requireRole("admin")({ headers: {} }, {}, next);

  assert.equal(next.calls[0]?.status, 403);
});
