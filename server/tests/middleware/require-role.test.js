const { test } = require("node:test");
const assert = require("node:assert/strict");

const requireRole = require("../../src/middleware/require-role");

function makeRes() {
  const res = {
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; },
  };
  return res;
}

test("requireRole calls next() when user has the required role", () => {
  const req = { user: { id: "u1", role: "admin" } };
  const res = makeRes();
  let nextArg;

  requireRole("admin")(req, res, (arg) => { nextArg = arg; });

  assert.equal(nextArg, undefined, "next() must be called with no argument");
});

test("requireRole calls next(ApiError) with 403 when role does not match", () => {
  const req = { user: { id: "u1", role: "volunteer" } };
  const res = makeRes();
  let nextArg;

  requireRole("admin")(req, res, (arg) => { nextArg = arg; });

  assert.ok(nextArg, "next() must be called with an error");
  assert.equal(nextArg.status, 403);
});

test("requireRole calls next(ApiError) with 403 when req.user is absent", () => {
  const req = {};
  const res = makeRes();
  let nextArg;

  requireRole("admin")(req, res, (arg) => { nextArg = arg; });

  assert.ok(nextArg, "next() must be called with an error");
  assert.equal(nextArg.status, 403);
});
