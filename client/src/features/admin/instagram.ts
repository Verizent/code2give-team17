/**
 * Instagram profile helpers for Staff hub story desk.
 * Points at the real Love 21 account — compose/publish stays in Instagram
 * (Graph authoring deferred; see CONTEXT §22 substitute in admin plan).
 */

const DEFAULT_PROFILE = 'https://www.instagram.com/love21foundation/'

export function instagramProfileUrl(): string {
  const fromEnv = String(import.meta.env.VITE_INSTAGRAM_PROFILE_URL ?? '').trim()
  return fromEnv || DEFAULT_PROFILE
}

/** Optional comma-separated permalinks for embed cards. */
export function instagramPostUrls(): string[] {
  const raw = String(import.meta.env.VITE_INSTAGRAM_POST_URLS ?? '').trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export const SUGGESTED_HASHTAGS = '#SoMuchAbility #Love21'
