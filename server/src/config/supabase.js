const { createClient } = require("@supabase/supabase-js");

let supabase;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const error = new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be set in server/.env",
    );
    error.status = 503;
    throw error;
  }

  return { url, anonKey };
}

function getSupabase() {
  if (!supabase) {
    const { url, anonKey } = getSupabaseConfig();
    supabase = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabase;
}

async function checkSupabaseConnection() {
  const { url, anonKey } = getSupabaseConfig();
  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
    headers: {
      apikey: anonKey,
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

