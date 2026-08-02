const { test } = require("node:test");
const assert = require("node:assert/strict");

const { assertOk, throwIfDbError, PG } = require("../../src/data/supabase-error");

/**
 * These exist because the volunteers merge left two repos importing a `PG` constant
 * this module never exported. `PG.UNIQUE_VIOLATION` on an undefined `PG` throws a
 * TypeError, and it does so on the SUCCESS path too — the comparison is evaluated
 * before `error?.code` can short-circuit anything. Four endpoints 500'd on every
 * call as a result.
 */

test("exports the Postgres error codes the volunteer repos import", () => {
  assert.equal(PG.UNIQUE_VIOLATION, "23505");
  assert.equal(PG.FOREIGN_KEY_VIOLATION, "23503");
  assert.equal(PG.CHECK_VIOLATION, "23514");
  assert.equal(PG.NOT_NULL_VIOLATION, "23502");
});

test("PG is frozen so a repo cannot mutate a shared constant", () => {
  assert.equal(Object.isFrozen(PG), true);
});

test("reading PG.UNIQUE_VIOLATION never throws — the success path evaluates it too", () => {
  // The exact shape of the bug: `if (error?.code === PG.UNIQUE_VIOLATION)` runs on
  // every call, so an undefined PG breaks inserts that actually succeeded.
  const error = null;
  assert.doesNotThrow(() => error?.code === PG.UNIQUE_VIOLATION);
});

test("throwIfDbError does nothing when there is no error", () => {
  assert.doesNotThrow(() => throwIfDbError(null));
  assert.doesNotThrow(() => throwIfDbError(undefined));
});

test("throwIfDbError turns a unique violation into a 409 using conflictMessage", () => {
  // The option was already being passed at four call sites and silently ignored,
  // because throwIfDbError was aliased straight to assertOk. A duplicate signup
  // surfaced as a 500 rather than a message the form could show.
  assert.throws(
    () => throwIfDbError({ code: PG.UNIQUE_VIOLATION, message: "duplicate key" }, {
      conflictMessage: "You have already signed up for this opportunity",
    }),
    (error) => {
      assert.equal(error.status, 409);
      assert.equal(error.message, "You have already signed up for this opportunity");
      return true;
    },
  );
});

test("throwIfDbError still 500s a unique violation when no conflictMessage is given", () => {
  // Without a caller-supplied message there is nothing useful to show a user, and
  // inventing one would leak schema detail.
  assert.throws(
    () => throwIfDbError({ code: PG.UNIQUE_VIOLATION, message: "duplicate key" }),
    (error) => {
      assert.equal(error.status, 500);
      return true;
    },
  );
});

test("throwIfDbError 500s any other database error", () => {
  assert.throws(
    () => throwIfDbError({ code: "42P01", message: "relation does not exist" }, {
      conflictMessage: "unused",
    }),
    (error) => {
      assert.equal(error.status, 500);
      assert.match(error.message, /relation does not exist/);
      return true;
    },
  );
});

test("assertOk keeps its original 500-on-any-error behaviour", () => {
  // The content track calls assertOk directly and must not inherit conflict handling.
  assert.doesNotThrow(() => assertOk(null));
  assert.throws(
    () => assertOk({ code: PG.UNIQUE_VIOLATION, message: "duplicate key" }),
    (error) => {
      assert.equal(error.status, 500);
      return true;
    },
  );
});
