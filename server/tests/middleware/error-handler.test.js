const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const { ApiError } = require("../../src/lib/api-error");
const errorHandler = require("../../src/middleware/error-handler");

function responseSpy() {
  return {
    headersSent: false,
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function handle(t, error) {
  // The handler logs every error; keep the suite output readable.
  mock.method(console, "error", () => {});
  t.after(() => mock.restoreAll());

  const response = responseSpy();
  errorHandler(error, {}, response, () => {});
  return response;
}

test("uses the code an ApiError carries", (t) => {
  const response = handle(t, ApiError.notFound("Article not found"));

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.code, "NOT_FOUND");
});

test("does not emit a provider's own error code into the envelope", (t) => {
  // Supabase's AuthApiError shape. `code` is the one field that survives the
  // production message suppression, so it is the one field a client branches on —
  // shipping "bad_jwt" there puts a provider's vocabulary into our contract.
  const authApiError = Object.assign(new Error("invalid claim"), {
    name: "AuthApiError",
    status: 401,
    code: "bad_jwt",
  });

  const response = handle(t, authApiError);

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.code, "UNAUTHENTICATED");
});

test("does not emit a Node system error code into the envelope", (t) => {
  const dnsFailure = Object.assign(new Error("getaddrinfo ENOTFOUND"), {
    code: "ENOTFOUND",
  });

  const response = handle(t, dnsFailure);

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.code, "INTERNAL");
});

test("keeps code but drops message when NODE_ENV is production", (t) => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  t.after(() => {
    process.env.NODE_ENV = original;
  });

  const response = handle(t, new ApiError(500, "connection string: postgres://u:p@h"));

  assert.equal(response.body.message, undefined);
  assert.equal(response.body.code, "INTERNAL");
});

test("never puts a data key beside an error", (t) => {
  const response = handle(t, ApiError.forbidden());

  // §29: success and failure are told apart by which key is present.
  assert.equal("data" in response.body, false);
});
