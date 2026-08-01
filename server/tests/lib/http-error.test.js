const test = require("node:test");
const assert = require("node:assert/strict");

const { httpError } = require("../../src/lib/http-error");

test("returns a real Error so stack traces still work", () => {
  assert.ok(httpError(404, "No such article") instanceof Error);
});

test("carries the status the error handler formats from", () => {
  assert.equal(httpError(409, "Slug already taken").status, 409);
});

test("preserves the message verbatim", () => {
  assert.equal(httpError(422, "story: too short").message, "story: too short");
});

// The envelope carries no `code` field — the status line is the only machine-readable
// signal, and a second parallel taxonomy is one more thing to keep in sync (CONTEXT.md §29).
test("adds no code field", () => {
  assert.equal(httpError(400, "Bad input").code, undefined);
});
