const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const adminRouter = require("../../src/routes/admin");

const ROUTES_INDEX = path.join(__dirname, "../../src/routes/index.js");

/**
 * These two tests assert on structure rather than on a response, because the thing
 * they defend against is a merge, not a code path.
 *
 * The donations track carries `routes/admin.routes.js`, which mounts campaign
 * moderation at /api/admin outside this guard and says so in its own DEMO-ONLY
 * comment. Resolved the obvious way - keeping both `router.use` lines - whether
 * those endpoints end up guarded depends on which mount Express reaches first.
 * That is exactly the accident the single-mount design exists to prevent, so it is
 * worth failing loudly at the moment of conflict resolution instead of shipping an
 * open admin endpoint.
 *
 * There is no supertest in this project and adding one is a shared-file change, so
 * an HTTP-level assertion is not available here.
 */

test("exactly one router is mounted under /api/admin", () => {
  const source = fs.readFileSync(ROUTES_INDEX, "utf8");
  const mounts = source.match(/router\.use\(\s*"(\/api\/admin[^"]*)"/g) ?? [];

  assert.equal(
    mounts.length,
    1,
    `Expected a single /api/admin mount in routes/index.js, found ${mounts.length}:\n` +
      `${mounts.join("\n")}\n\n` +
      "Every admin router must be mounted inside routes/admin/index.js so it " +
      "inherits requireRole('admin'). A second mount here bypasses that guard.",
  );
});

test("the admin router applies requireRole before any of its sub-routes", () => {
  const [first] = adminRouter.stack;

  // Asserted before reading through it: with optional chaining an empty stack —
  // the guard removed entirely — would compare undefined to undefined and pass.
  assert.ok(first, "admin router has no layers, so no guard is mounted");

  // Position matters, not merely presence: a guard mounted after a sub-route would
  // leave that route reachable.
  assert.equal(first.handle.name, "requireRoleMiddleware");
});
