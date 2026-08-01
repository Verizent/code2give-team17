process.env.SERVER_SECRET = "test-secret-not-a-real-one";

const test = require("node:test");
const assert = require("node:assert/strict");

const { visitorHash } = require("../../src/lib/visitor-hash");

const IP = "203.0.113.7";
const OTHER_IP = "198.51.100.4";
const UA = "Mozilla/5.0 (TestRunner)";
const DAY = "2026-08-01";
const NEXT_DAY = "2026-08-02";

test("is stable for the same visitor within one UTC day", () => {
  assert.equal(visitorHash(IP, UA, DAY), visitorHash(IP, UA, DAY));
});

// The whole privacy design rests on this: the salt is derived from the date, so
// the same reader is unrecoverable across days by construction rather than by policy.
test("differs across days for an identical ip and user agent", () => {
  assert.notEqual(visitorHash(IP, UA, DAY), visitorHash(IP, UA, NEXT_DAY));
});

test("differs between two visitors on the same day", () => {
  assert.notEqual(visitorHash(IP, UA, DAY), visitorHash(OTHER_IP, UA, DAY));
});

test("differs between two user agents on the same day", () => {
  assert.notEqual(visitorHash(IP, UA, DAY), visitorHash(IP, "Other/1.0", DAY));
});

test("never leaks the raw ip or user agent into the stored value", () => {
  const hash = visitorHash(IP, UA, DAY);

  assert.ok(!hash.includes(IP), "hash must not contain the raw ip");
  assert.ok(!hash.includes("Mozilla"), "hash must not contain the raw user agent");
});

test("produces a fixed-length hex digest", () => {
  assert.match(visitorHash(IP, UA, DAY), /^[0-9a-f]{64}$/);
});

// Lazily, not at boot: a missing secret must not stop a teammate's server from
// starting when they pull (plan, shared surfaces #4).
test("fails with an actionable message when SERVER_SECRET is unset", () => {
  const original = process.env.SERVER_SECRET;
  delete process.env.SERVER_SECRET;

  try {
    assert.throws(() => visitorHash(IP, UA, DAY), /SERVER_SECRET is not set/);
  } finally {
    process.env.SERVER_SECRET = original;
  }
});

test("defaults to today when no day is supplied", () => {
  assert.match(visitorHash(IP, UA), /^[0-9a-f]{64}$/);
});
