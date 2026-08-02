// `node --test` does not load `server/.env` the way `index.js` does, so without this the
// checks below skip on every run — which looks green and proves nothing.
require("dotenv").config({ quiet: true });

const { test } = require("node:test");
const assert = require("node:assert/strict");

/**
 * The one test in this suite that talks to a real database.
 *
 * Every other test mocks its repository with `mock.method()`, which is the right shape for
 * unit tests but leaves a specific blind spot: nothing notices when a table is missing or
 * unreadable. Six such faults reached this branch green over 2026-08-01→02 —
 * `stripe_events`, `donor_periods`, `sessions`, `content_events` and `instagram_embeds` all
 * shipped without `service_role` DML grants, and `donation_allocations` did not exist at all
 * while twelve commits were written against it.
 *
 * The cause is structural, not carelessness: tables created via `apply_migration` do **not**
 * inherit the default privileges dashboard-created tables get, so a migration succeeds, the
 * table appears, and every server query against it still fails with
 * `permission denied for table`.
 *
 * A single `select … limit 1` per table would have caught all six on the day each landed.
 * That is all this file does.
 */

const REQUIRED_TABLES = [
  "donors",
  "donations",
  "donor_periods",
  "stripe_events",
  "sessions",
  "donation_allocations",
];

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Skip rather than fail when credentials are absent, so a teammate who has not filled in
 * `server/.env` still gets a green `npm test`.
 */
const skip = SUPABASE_URL && SERVICE_ROLE_KEY
  ? false
  : "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — skipping live database contract";

const restUrl = String(SUPABASE_URL ?? "").replace(/\/$/, "");
const authHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

test("every donations table is readable by the service role", { skip }, async () => {
  // Deliberately raw fetch, not supabase-js. The client returns
  // `{ error: null, count: null }` for a table that does not exist on the
  // `{ head: true, count: 'exact' }` path — it will pass a test against a missing table.
  // Only the raw 404 (PGRST205) is trustworthy. This cost real debugging time twice.
  const failures = [];

  for (const table of REQUIRED_TABLES) {
    const response = await fetch(`${restUrl}/rest/v1/${table}?select=*&limit=1`, {
      headers: authHeaders,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      failures.push(`${table} → HTTP ${response.status} ${body.message ?? ""}`.trim());
    }
  }

  assert.deepEqual(failures, [], `unreadable tables:\n  ${failures.join("\n  ")}`);
});

test("every donations table is writable by the service role", { skip }, async () => {
  // Read access alone is not enough: a table can be SELECT-able and still reject INSERT,
  // which is exactly how the allocation path failed. PostgREST's OpenAPI spec lists only the
  // methods the calling role actually holds, so this proves the write grants without
  // inserting a row.
  const response = await fetch(`${restUrl}/rest/v1/`, { headers: authHeaders });
  assert.equal(response.status, 200, "could not read the PostgREST schema");

  const spec = await response.json();
  const failures = [];

  for (const table of REQUIRED_TABLES) {
    const methods = Object.keys(spec.paths?.[`/${table}`] ?? {});

    if (methods.length === 0) {
      failures.push(`${table} → not exposed at all (missing table, or no grants)`);
      continue;
    }
    for (const method of ["post", "patch"]) {
      if (!methods.includes(method)) {
        failures.push(`${table} → no ${method.toUpperCase()} (has: ${methods.join(", ")})`);
      }
    }
  }

  assert.deepEqual(failures, [], `tables the server cannot write:\n  ${failures.join("\n  ")}`);
});

test("sessions carries the columns the allocation query selects", { skip }, async () => {
  // `sessions` is shared with the admin track and was reconciled once already
  // (migration 20260803_1075). A column quietly renamed on the other side breaks allocation
  // at runtime while every mocked test stays green.
  const response = await fetch(`${restUrl}/rest/v1/`, { headers: authHeaders });
  const spec = await response.json();
  const columns = Object.keys(spec.definitions?.sessions?.properties ?? {});

  assert.notEqual(columns.length, 0, "sessions is not exposed to the service role");

  // Mirrors ELIGIBLE_COLUMNS in src/data/sessions.repo.js.
  const required = [
    "id", "title_en", "title_zh", "programme",
    "starts_at", "ends_at", "location_en", "location_zh", "status",
  ];
  const missing = required.filter((column) => !columns.includes(column));

  assert.deepEqual(missing, [], `sessions is missing: ${missing.join(", ")}`);
});
