/**
 * Single integration point (CONTEXT §12).
 * Call sites pass full `/api/...` paths. Prefer empty `VITE_API_BASE_URL` so
 * Vite's `/api` proxy (or same-origin deploy) works; fall back to
 * `VITE_API_URL` (e.g. `http://localhost:3000`) when calling the host directly.
 */

function readBase(): string {
  // Empty string in .env is intentional (same-origin /api). Do not fall through to VITE_API_URL.
  if (Object.hasOwn(import.meta.env, 'VITE_API_BASE_URL')) {
    return String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
  }
  return String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
}

const BASE = readBase()

let authTokenGetter: (() => string | null) | null = null

/** Register a function that returns the current Supabase access token (or null). */
export function setAuthTokenGetter(getter: (() => string | null) | null) {
  authTokenGetter = getter
}

/**
 * Join base + path without producing `/api/api/...`.
 * @param {string} path
 */
export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path

  const normalised = path.startsWith('/') ? path : `/${path}`

  // Paths already rooted at /api never get another /api prefix.
  if (normalised === '/api' || normalised.startsWith('/api/')) {
    if (/^https?:\/\//i.test(BASE)) {
      return `${BASE}${normalised}`
    }
    return normalised
  }

  if (!BASE) return normalised

  if (/^https?:\/\//i.test(BASE)) {
    return `${BASE}${normalised}`
  }

  if (normalised === BASE || normalised.startsWith(`${BASE}/`)) return normalised
  return `${BASE}${normalised}`
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.status = status
  }
}

export type Envelope<T> = {
  data: T
  meta?: { total: number; page: number; limit: number }
}

export async function apiClient<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = resolveApiUrl(path)
  const token = authTokenGetter?.() ?? null
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    throw new ApiError(await res.text().catch(() => res.statusText), res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/** Unwrap CONTEXT §29 `{ data, meta? }` success envelope. */
export async function apiData<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; meta?: Envelope<T>['meta'] }> {
  const body = await apiClient<Envelope<T> | T>(path, init)
  if (body && typeof body === 'object' && 'data' in body) {
    return body as Envelope<T>
  }
  return { data: body as T }
}

export function isRealApiMode() {
  return (import.meta.env.VITE_API_MODE as string | undefined) !== 'mock'
}
