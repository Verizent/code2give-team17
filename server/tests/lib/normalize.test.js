const { test } = require("node:test");
const assert = require("node:assert/strict");

const { normalizeEmail } = require("../../src/lib/normalize");

test("normalizeEmail lowercases the address", () => {
  assert.equal(normalizeEmail("Bob@Example.COM"), "bob@example.com");
});

test("normalizeEmail trims surrounding whitespace", () => {
  assert.equal(normalizeEmail("  alice@example.com  "), "alice@example.com");
});

test("normalizeEmail trims AND lowercases together", () => {
  assert.equal(normalizeEmail("  BOB@EXAMPLE.COM  "), "bob@example.com");
});

test("normalizeEmail returns empty string for null", () => {
  assert.equal(normalizeEmail(null), "");
});

test("normalizeEmail returns empty string for undefined", () => {
  assert.equal(normalizeEmail(undefined), "");
});

test("normalizeEmail returns empty string for empty string", () => {
  assert.equal(normalizeEmail(""), "");
});
