const path = require("node:path");
const crypto = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Why every suite is skipped rather than failed when credentials are absent.
 *
 * Our tables have RLS enabled with no policies (§9), so the anon key reads and writes NOTHING
 * without raising an error. A suite run on the anon key would fail with a wall of confusing
 * empty-result assertions rather than the one fact that matters, so we refuse to run at all.
 *
 * @type {string | false}
 */
const skip =
  !SUPABASE_URL || !SERVICE_ROLE_KEY
    ? "SUPABASE_SERVICE_ROLE_KEY (and SUPABASE_URL) must be set in server/.env — " +
      "the anon key cannot see these tables at all"
    : false;

let client;

/**
 * The service-role client. Bypasses RLS, which is the only way to reach these tables.
 *
 * @returns {import("@supabase/supabase-js").SupabaseClient}
 */
function db() {
  if (!client) {
    client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client;
}

/** @returns {string} A value no other test run or teammate will collide with. */
function uid() {
  return crypto.randomUUID();
}

/** @returns {string} Normalised, unique, and obviously synthetic. */
function testEmail(label = "v") {
  return `test-${label}-${uid()}@example.test`;
}

/** @returns {string} 43 chars, clearing the `length >= 32` floor on access_token. */
function testToken() {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Tracks rows so a suite deletes exactly what it created and nothing else.
 *
 * These tests run against the SHARED project alongside other tracks' data, so blanket deletes
 * are never acceptable. Rows are removed newest-first so foreign keys unwind cleanly.
 */
function tracker() {
  const created = [];

  return {
    /**
     * @template T
     * @param {string} table
     * @param {T & { id: string }} row
     * @returns {T & { id: string }}
     */
    track(table, row) {
      created.push({ table, id: row.id });
      return row;
    },

    async cleanup() {
      for (const { table, id } of created.reverse()) {
        await db().from(table).delete().eq("id", id);
      }
      created.length = 0;
    },
  };
}

/**
 * Inserts a row and asserts it succeeded, returning the row.
 *
 * @param {string} table
 * @param {object} values
 * @returns {Promise<object>}
 */
async function insert(table, values) {
  const { data, error } = await db().from(table).insert(values).select().single();

  if (error) {
    throw new Error(`insert into ${table} failed: ${error.message}`);
  }

  return data;
}

/**
 * Attempts an insert expected to be REJECTED by the database, and returns the error so the
 * caller can assert which constraint fired.
 *
 * @param {string} table
 * @param {object} values
 * @returns {Promise<{ code: string, message: string }>}
 */
async function insertExpectingFailure(table, values) {
  const { error } = await db().from(table).insert(values).select().single();

  if (!error) {
    throw new Error(
      `insert into ${table} SUCCEEDED but the schema should have rejected it: ` +
        JSON.stringify(values),
    );
  }

  return error;
}

/** Postgres SQLSTATEs the schema relies on. */
const PG = {
  CHECK_VIOLATION: "23514",
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  NOT_NULL_VIOLATION: "23502",
};

module.exports = {
  skip,
  db,
  uid,
  testEmail,
  testToken,
  tracker,
  insert,
  insertExpectingFailure,
  PG,
};
