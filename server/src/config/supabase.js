const { createClient } = require("@supabase/supabase-js");

let supabase;

/**
 * CONTEXT.md §9: the server holds the service-role key and every read and write
 * goes through this API. The browser only ever uses the anon key, for Auth.
 * Service-role bypasses RLS, so this value must never reach the client bundle.
 */
function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    const error = new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env",
    );
    error.status = 503;
    throw error;
  }

  return { url, serviceRoleKey };
}

let serviceClient;

/**
 * The client every query should use. §9: the frontend never queries Supabase directly, the server
 * holds the service-role key, and RLS is applied to every table as defence in depth.
 *
 * That last part is why this exists: our tables have RLS enabled with **no policies**, so the
 * anon client above reaches nothing at all. Anything touching a table needs this client.
 *
 * @returns {import("@supabase/supabase-js").SupabaseClient}
 */
function getServiceClient() {
  if (serviceClient) {
    return serviceClient;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    const error = new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env",
    );
    error.status = 503;
    throw error;
  }

  serviceClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return serviceClient;
}

function getSupabase() {
  if (!supabase) {
    const { url, serviceRoleKey } = getSupabaseConfig();
    supabase = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabase;
}

async function checkSupabaseConnection() {
  const { url, serviceRoleKey } = getSupabaseConfig();
  let response;
  try {
    response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
      headers: {
        apikey: serviceRoleKey,
      },
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    const cause = error instanceof Error ? error.message : "unknown network error";
    const wrapped = new Error(
      `Cannot reach Supabase at ${url} (${cause}). Check SUPABASE_URL, DNS, and that the project is not paused.`,
    );
    wrapped.status = 503;
    throw wrapped;
  }

  if (!response.ok) {
    const error = new Error(`Supabase responded with HTTP ${response.status}`);
    error.status = 503;
    throw error;
  }

  return true;
}

module.exports = { getSupabase, getServiceClient, checkSupabaseConnection };

