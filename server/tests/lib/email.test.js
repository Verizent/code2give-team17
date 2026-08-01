const { test } = require("node:test");
const assert = require("node:assert/strict");

const { normaliseEmail } = require("../../src/lib/email");

test("lowercases the address", () => {
  assert.equal(normaliseEmail("Bob@Example.COM"), "bob@example.com");
});

test("strips surrounding whitespace", () => {
  assert.equal(normaliseEmail("  bob@example.com  "), "bob@example.com");
});

test("is idempotent — normalising twice changes nothing", () => {
  const once = normaliseEmail("  Bob@Example.COM ");
  assert.equal(normaliseEmail(once), once);
});

test("matches the value the database check constraint would accept", () => {
  // volunteers.email carries `check (email = lower(btrim(email)))`. A value this
  // function returns must satisfy that, or every insert throws.
  const normalised = normaliseEmail(" Volunteer@Love21.HK ");
  assert.equal(normalised, normalised.trim().toLowerCase());
});

test("throws on a non-string rather than coercing", () => {
  // String(null) is "null" — a perfectly valid-looking lookup key that matches no
  // row. A silent miss is indistinguishable from "no such volunteer", which is the
  // failure this whole function exists to prevent (§15).
  assert.throws(() => normaliseEmail(null), TypeError);
  assert.throws(() => normaliseEmail(undefined), TypeError);
  assert.throws(() => normaliseEmail(42), TypeError);
});

test("throws on an empty or whitespace-only address", () => {
  // Same reasoning: "" would query happily and match nothing.
  assert.throws(() => normaliseEmail(""), TypeError);
  assert.throws(() => normaliseEmail("   "), TypeError);
});
