const { test } = require("node:test");
const assert = require("node:assert/strict");

const rateLimit = require("../../src/middleware/rate-limit");

/** Captures whatever the middleware hands to next(). */
function nextSpy() {
  const calls = [];
  const next = (error) => calls.push(error);
  next.calls = calls;
  return next;
}

/** Minimal response — the middleware sets Retry-After on a refusal. */
function responseStub() {
  const headers = {};
  return { headers, set: (name, value) => { headers[name] = value; } };
}

/**
 * Drives one request through and returns what next() received.
 * @returns {{ error: unknown, response: { headers: Record<string, string> } }}
 */
function call(middleware, request) {
  const next = nextSpy();
  const response = responseStub();
  middleware(request, response, next);
  return { error: next.calls[0], response };
}

test("requests are allowed up to the limit, and the next one is refused with 429", () => {
  const middleware = rateLimit({ key: "t", limit: 3 });
  const request = { ip: "1.2.3.4" };

  for (let i = 1; i <= 3; i += 1) {
    assert.equal(call(middleware, request).error, undefined, `request ${i} should pass`);
  }

  const refused = call(middleware, request);
  assert.equal(refused.error?.status, 429);
  assert.equal(refused.error?.code, "RATE_LIMITED", "clients branch on the §29 code");
});

test("a refusal carries Retry-After in whole seconds", () => {
  const middleware = rateLimit({ key: "t", limit: 1, windowMs: 60_000 });
  const request = { ip: "1.2.3.4" };

  call(middleware, request);
  const refused = call(middleware, request);

  const retryAfter = Number(refused.response.headers["Retry-After"]);
  assert.ok(retryAfter > 0 && retryAfter <= 60, `expected 1..60, got ${retryAfter}`);
});

test("separate identities get separate budgets", () => {
  // The whole point of keying: one abusive caller must not lock everyone else out.
  const middleware = rateLimit({ key: "t", limit: 1 });

  assert.equal(call(middleware, { ip: "1.1.1.1" }).error, undefined);
  assert.equal(call(middleware, { ip: "1.1.1.1" }).error?.status, 429, "first ip exhausted");
  assert.equal(call(middleware, { ip: "2.2.2.2" }).error, undefined, "second ip unaffected");
});

test("two limiters keep independent stores", () => {
  // Each rateLimit() closes over its own Map. Sharing one would let a busy route throttle a
  // quiet one, and would make test order significant.
  const first = rateLimit({ key: "a", limit: 1 });
  const second = rateLimit({ key: "b", limit: 1 });
  const request = { ip: "1.2.3.4" };

  call(first, request);
  assert.equal(call(first, request).error?.status, 429);
  assert.equal(call(second, request).error, undefined, "second limiter is untouched");
});

test("the window expires and the budget returns", async () => {
  const middleware = rateLimit({ key: "t", limit: 1, windowMs: 20 });
  const request = { ip: "1.2.3.4" };

  call(middleware, request);
  assert.equal(call(middleware, request).error?.status, 429);

  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.equal(call(middleware, request).error, undefined, "budget resets after the window");
});

test("a custom identify can charge several axes at once", () => {
  // Used by the email-verification send path: exhausting either the address or the caller
  // refuses the request.
  const middleware = rateLimit({
    key: "t",
    limit: 1,
    identify: (request) => [`email:${request.body.email}`, `ip:${request.ip}`],
  });

  assert.equal(
    call(middleware, { ip: "1.1.1.1", body: { email: "a@b.com" } }).error,
    undefined,
  );

  // Different IP, same address — refused on the address axis.
  assert.equal(
    call(middleware, { ip: "9.9.9.9", body: { email: "a@b.com" } }).error?.status,
    429,
    "a victim's inbox is protected across source addresses",
  );

  // Different address, same IP — refused on the caller axis.
  assert.equal(
    call(middleware, { ip: "1.1.1.1", body: { email: "z@b.com" } }).error?.status,
    429,
  );
});

test("an unidentifiable caller is let through rather than blocked", () => {
  // Fail open. A missing request.ip should degrade to the old no-op behaviour, not refuse
  // every request on the route.
  const middleware = rateLimit({ key: "t", limit: 1, identify: () => null });

  assert.equal(call(middleware, {}).error, undefined);
  assert.equal(call(middleware, {}).error, undefined);
});

test("RATE_LIMIT_DISABLED bypasses the limiter entirely", (t) => {
  const previous = process.env.RATE_LIMIT_DISABLED;
  process.env.RATE_LIMIT_DISABLED = "true";
  t.after(() => {
    if (previous === undefined) delete process.env.RATE_LIMIT_DISABLED;
    else process.env.RATE_LIMIT_DISABLED = previous;
  });

  const middleware = rateLimit({ key: "t", limit: 1 });
  const request = { ip: "1.2.3.4" };

  call(middleware, request);
  assert.equal(call(middleware, request).error, undefined, "no refusal while disabled");
});
