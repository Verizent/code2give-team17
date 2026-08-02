const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROUTES_DIR = path.join(__dirname, "../../src/routes");

/**
 * Source-text assertions, for the same reason as tests/routes/admin-mount.test.js:
 * there is no supertest in this project and adding one is a shared-file change, so
 * an HTTP-level assertion is not available. What these defend against is a future
 * edit re-introducing a contract mismatch, not a single code path.
 *
 * Both rules below exist because the volunteer track was written against a
 * `request.user` contract while this branch's auth layer publishes `request.auth`.
 * The merge joined them cleanly and silently — nothing failed, callers simply became
 * anonymous, and one route started throwing on `undefined.id`.
 */

/** @returns {{ name: string, source: string }[]} every .js under src/routes, recursively */
function readRouteFiles(dir = ROUTES_DIR, prefix = "") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return readRouteFiles(full, `${prefix}${entry.name}/`);
    }
    if (!entry.name.endsWith(".js")) {
      return [];
    }
    return [{ name: `${prefix}${entry.name}`, source: fs.readFileSync(full, "utf8") }];
  });
}

test("no route reads request.user — the auth layer publishes request.auth", () => {
  const offenders = readRouteFiles()
    .filter(({ source }) => /\brequest\.user\b|\breq\.user\b/.test(source))
    .map(({ name }) => name);

  assert.deepEqual(
    offenders,
    [],
    `These route files read request.user, which nothing ever sets:\n${offenders.join("\n")}\n\n` +
      "Use actorFromAuth(request.auth) from src/lib/actor.js. Reading request.user " +
      "yields undefined, so a signed-in caller is silently treated as anonymous " +
      "and any service doing user.id throws.",
  );
});

test("every route using volunteerContext resolves auth before it", () => {
  // volunteer-context.js falls back to request.auth?.userId when no X-Volunteer-Token
  // is present. Without optionalAuth/requireAuth ahead of it that branch is dead, and
  // a signed-in volunteer holding a valid JWT but no opaque token gets a 401.
  const offenders = readRouteFiles()
    .filter(({ source }) => source.includes("volunteerContext"))
    .filter(({ source }) => !/\b(optionalAuth|requireAuth)\b/.test(source))
    .map(({ name }) => name);

  assert.deepEqual(
    offenders,
    [],
    `These route files mount volunteerContext with no auth resolved first:\n${offenders.join("\n")}\n\n` +
      "Mount optionalAuth (or requireAuth) before volunteerContext, or its " +
      "profile_id branch can never fire.",
  );
});

test("volunteer-signups mounts optionalAuth ahead of volunteerContext on every route", () => {
  const source = fs.readFileSync(
    path.join(ROUTES_DIR, "volunteer-signups.routes.js"),
    "utf8",
  );

  const chains = [...source.matchAll(/router\.(get|post|patch|delete)\(\s*("[^"]*")([\s\S]*?)async \(/g)];

  assert.ok(chains.length > 0, "no route chains found — has the regex drifted?");

  const unresolved = chains
    .filter(([, , , middleware]) => {
      const optionalAt = middleware.indexOf("optionalAuth");
      const contextAt = middleware.indexOf("volunteerContext");
      return optionalAt === -1 || (contextAt !== -1 && optionalAt > contextAt);
    })
    .map(([, method, routePath]) => `${method.toUpperCase()} ${routePath}`);

  assert.deepEqual(
    unresolved,
    [],
    `These signup routes do not resolve auth before volunteerContext:\n${unresolved.join("\n")}`,
  );
});

test("no orphan router sits under src/routes/admin/", () => {
  // src/routes/admin/index.js was merged in unmounted and with default-imports of
  // { requireAuth } / { requireRole } — requireRole("admin") on a module object is a
  // TypeError. It is harmless only for as long as nobody wires it up.
  const indexPath = path.join(ROUTES_DIR, "admin", "index.js");
  const routesIndex = fs.readFileSync(path.join(ROUTES_DIR, "index.js"), "utf8");

  if (!fs.existsSync(indexPath)) {
    return;
  }

  assert.match(
    routesIndex,
    /require\("\.\/admin"\)|require\("\.\/admin\/index"\)/,
    "src/routes/admin/index.js exists but routes/index.js never mounts it. " +
      "Delete it, or mount it — an unmounted router drifts out of sync with the " +
      "guards its neighbours carry.",
  );
});
