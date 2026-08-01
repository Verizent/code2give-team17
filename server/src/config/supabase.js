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
  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
    headers: {
      apikey: serviceRoleKey,
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    const error = new Error(`Supabase responded with HTTP ${response.status}`);
    error.status = 503;
    throw error;
  }

  return true;
}

module.exports = { getSupabase, checkSupabaseConnection };

