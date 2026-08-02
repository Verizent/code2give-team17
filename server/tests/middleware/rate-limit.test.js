const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const rateLimit = require("../../src/middleware/rate-limit");

/**
 * This was a no-op stub. That was harmless while EMAIL_MODE was effectively always
 * log-mode, because POST /api/email-verifications only ever printed to a console. With
 * SMTP wired, an unauthenticated endpoint that emails any address without limit is an
 * email-bombing tool — and it sends from our own domain, so the abuse is attributed to us.
 */
function run(middleware, { ip = "1.2.3.4", body = {} } = {}) {
  return new Promise((resolve) => {
    const request = { ip, body, get: () => undefined };
    const response = {
      statusCode: null,
      headers: {},
      set(key, value) {
        this.headers[key] = value;
        return this;
      },
    };
    middleware(request, response, (error) => resolve({ error, response }));
  });
}

test("allows requests up to the limit", async () => {
  const limiter = rateLimit({ key: "test-allow", limit: 3, windowMs: 60_000 });

  for (let i = 0; i < 3; i += 1) {
    const { error } = await run(limiter);
    assert.equal(error, undefined, `request ${i + 1} should pass`);
  }
});

test("refuses the request past the limit with 429", async () => {
  const limiter = rateLimit({ key: "test-refuse", limit: 2, windowMs: 60_000 });

  await run(limiter);
  await run(limiter);
  const { error } = await run(limiter);

  assert.ok(error, "fourth request is refused");
  assert.equal(error.status, 429);
});

/**
 * Per address, not only per IP. A shared NAT must not lock everyone out, and one attacker
 * on one IP must not be able to bomb a thousand different inboxes.
 */
test("buckets by email address independently of the caller IP", async () => {
  const limiter = rateLimit({ key: "test-email", limit: 1, windowMs: 60_000 });

  const first = await run(limiter, { ip: "1.1.1.1", body: { email: "a@example.test" } });
  assert.equal(first.error, undefined);

  const sameEmailOtherIp = await run(limiter, {
    ip: "9.9.9.9",
    body: { email: "a@example.test" },
  });
  assert.equal(sameEmailOtherIp.error?.status, 429, "same address, different IP is still limited");

  const otherEmail = await run(limiter, { ip: "1.1.1.1", body: { email: "b@example.test" } });
  assert.equal(otherEmail.error, undefined, "a different address is unaffected");
});

test("normalises the address so casing cannot multiply the budget", async () => {
  const limiter = rateLimit({ key: "test-normalise", limit: 1, windowMs: 60_000 });

  await run(limiter, { body: { email: "Dana@Example.test" } });
  const { error } = await run(limiter, { body: { email: "  dana@example.TEST " } });

  assert.equal(error?.status, 429);
});

test("lets the budget recover once the window passes", async (t) => {
  let now = 1_000_000;
  mock.method(Date, "now", () => now);
  t.after(() => mock.restoreAll());

  const limiter = rateLimit({ key: "test-window", limit: 1, windowMs: 60_000 });

  assert.equal((await run(limiter)).error, undefined);
  assert.equal((await run(limiter)).error?.status, 429);

  now += 60_001;
  assert.equal((await run(limiter)).error, undefined, "window elapsed, budget restored");
});

test("keeps separate buckets per key so one endpoint cannot exhaust another", async () => {
  const a = rateLimit({ key: "test-key-a", limit: 1, windowMs: 60_000 });
  const b = rateLimit({ key: "test-key-b", limit: 1, windowMs: 60_000 });

  await run(a);
  assert.equal((await run(a)).error?.status, 429);
  assert.equal((await run(b)).error, undefined);
});
