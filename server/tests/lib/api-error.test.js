const { test } = require("node:test");
const assert = require("node:assert/strict");

const { ApiError, codeForStatus, labelForStatus } = require("../../src/lib/api-error");

test("derives the code from the status for every mapped status", () => {
  assert.equal(codeForStatus(400), "VALIDATION_FAILED");
  assert.equal(codeForStatus(401), "UNAUTHENTICATED");
  assert.equal(codeForStatus(403), "FORBIDDEN");
  assert.equal(codeForStatus(404), "NOT_FOUND");
  assert.equal(codeForStatus(409), "CONFLICT");
  assert.equal(codeForStatus(429), "RATE_LIMITED");
  assert.equal(codeForStatus(500), "INTERNAL");
});

// An unmapped status must still yield something a client can branch on, because `code` is
// the only field surviving production suppression — falling through to undefined would
// leave a production 4xx with no machine-readable signal at all.
test("falls back by status class rather than returning undefined", () => {
  assert.equal(codeForStatus(418), "VALIDATION_FAILED");
  assert.equal(codeForStatus(422), "VALIDATION_FAILED");
  assert.equal(codeForStatus(503), "INTERNAL");
  assert.equal(codeForStatus(200), "INTERNAL");
});

test("labels come from node:http so they track the status", () => {
  assert.equal(labelForStatus(404), "Not Found");
  assert.equal(labelForStatus(422), "Unprocessable Entity");
  assert.equal(labelForStatus(599), "Internal Server Error");
});

test("carries status and derived code, and is a real Error", () => {
  const error = new ApiError(409, "Slug already taken");

  assert.ok(error instanceof Error);
  assert.equal(error.name, "ApiError");
  assert.equal(error.status, 409);
  assert.equal(error.code, "CONFLICT");
  assert.equal(error.message, "Slug already taken");
});

test("an explicit code wins over the derived one", () => {
  assert.equal(new ApiError(409, "Email already verified", "ALREADY_VERIFIED").code, "ALREADY_VERIFIED");
});

test("each static factory sets both its status and its code", () => {
  const cases = [
    [ApiError.badRequest(), 400, "VALIDATION_FAILED"],
    [ApiError.unauthenticated(), 401, "UNAUTHENTICATED"],
    [ApiError.forbidden(), 403, "FORBIDDEN"],
    [ApiError.notFound(), 404, "NOT_FOUND"],
    [ApiError.conflict(), 409, "CONFLICT"],
    [ApiError.rateLimited(), 429, "RATE_LIMITED"],
  ];

  for (const [error, status, code] of cases) {
    assert.equal(error.status, status);
    assert.equal(error.code, code);
    assert.ok(error.message.length > 0, "every factory needs a usable default message");
  }
});

test("a caller-supplied message replaces the factory default", () => {
  assert.equal(ApiError.notFound('No published article with slug "x"').message, 'No published article with slug "x"');
});
