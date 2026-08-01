const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROUTES_INDEX = path.join(__dirname, "../../src/routes/index.js");

/**
 * Asserts on source text rather than on a response, because what this defends
 * against is a future edit, not a code path.
 *
 * `feature/donations-backend` guards admin surfaces per mount —
 * `router.use("/api/admin/x", adminGuard, xRoutes)` — rather than with a single
 * gated parent router. That track owns the admin routes, so this branch adopts the
 * pattern instead of forcing five mounts to move. The cost is that the guard is now
 * something each new admin route must remember, and a sixth route added without it
 * is open while looking exactly like its neighbours. This test is what replaces the
 * structural guarantee.
 *
 * There is no supertest in this project and adding one is a shared-file change, so
 * an HTTP-level assertion is not available.
 */

const ADMIN_MOUNT = /router\.use\(\s*"(\/api\/admin[^"]*)"\s*,\s*([A-Za-z_$][\w$]*)/g;

function readRoutesIndex() {
  return fs.readFileSync(ROUTES_INDEX, "utf8");
}

test("every /api/admin mount passes through adminGuard", () => {
  const source = readRoutesIndex();
  const mounts = [...source.matchAll(ADMIN_MOUNT)];

  assert.ok(mounts.length > 0, "no /api/admin mounts found — has the regex drifted?");

  const unguarded = mounts
    .filter(([, , firstArg]) => firstArg !== "adminGuard")
    .map(([, mountPath, firstArg]) => `${mountPath} -> ${firstArg}`);

  assert.deepEqual(
    unguarded,
    [],
    `These admin mounts do not apply adminGuard:\n${unguarded.join("\n")}\n\n` +
      "Every /api/admin/* route must be mounted as " +
      'router.use("/api/admin/…", adminGuard, …) or it is reachable unauthenticated.',
  );
});

test("adminGuard is authentication followed by an admin role check", () => {
  const source = readRoutesIndex();

  // Order matters: a role check reading an identity nothing has established yet
  // would decide on an absent role.
  assert.match(
    source,
    /const\s+adminGuard\s*=\s*\[\s*requireAuth\s*,\s*requireRole\(\s*"admin"\s*\)\s*\]/,
    "adminGuard must be exactly [requireAuth, requireRole(\"admin\")]",
  );
});

test("the guards are imported as named exports", () => {
  const source = readRoutesIndex();

  // require-auth.js and require-role.js export objects, not bare functions. A
  // default-style import yields undefined and Express throws at mount rather than
  // silently skipping the guard — but it throws at boot, so pin it here.
  assert.match(source, /const\s*\{\s*requireAuth\s*\}\s*=\s*require\("\.\.\/middleware\/require-auth"\)/);
  assert.match(source, /const\s*\{\s*requireRole\s*\}\s*=\s*require\("\.\.\/middleware\/require-role"\)/);
});
