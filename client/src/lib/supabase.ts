/**
 * Supabase browser client — Auth only (CONTEXT §9).
 * Never query tables from the browser; use the Express API with the JWT.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | null = null

export function isSupabaseConfigured() {
  return Boolean(
    url &&
      anonKey &&
      !url.includes('your-project') &&
      !anonKey.includes('your-anon'),
  )
}

export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in client/.env',
    )
  }
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}
