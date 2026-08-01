/**
 * Single integration point (CONTEXT §12).
 * Call sites pass full `/api/...` paths. Prefer empty `VITE_API_BASE_URL` so
 * Vite's `/api` proxy (or same-origin deploy) works; fall back to
 * `VITE_API_URL` when calling the host directly.
 * VITE_API_MODE toggles mock/real for features that still ship fixtures.
 */

function readBase() {
  // Empty string in .env is intentional (same-origin /api).
  if (Object.hasOwn(import.meta.env, 'VITE_API_BASE_URL')) {
    return String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
  }
  return String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
}

const BASE = readBase()

export const API_MODE = import.meta.env.VITE_API_MODE ?? 'real'

let authTokenGetter = null

/** Register a function that returns the current Supabase access token (or null). */
export function setAuthTokenGetter(getter) {
  authTokenGetter = getter
}

/** Join base + path without producing `/api/api/...`. */
export function resolveApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path

  const normalised = path.startsWith('/') ? path : `/${path}`

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

/**
 * Backend locale enum is `en | zh-Hant` only —
 * simplified requests ask the API for zh-Hant instead.
 */
export function toApiLocale(locale) {
  return locale === 'zh-Hans' ? 'zh-Hant' : locale
}

export class ApiError extends Error {
  constructor(message, statusOrOpts = 500) {
    if (statusOrOpts && typeof statusOrOpts === 'object') {
      super(message ?? 'Request failed')
      this.status = statusOrOpts.status
      this.code = statusOrOpts.code
    } else {
      super(message)
      this.status = statusOrOpts
    }
  }
}

export async function apiClient(path, init) {
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
    const raw = await res.text().catch(() => res.statusText)
    let body = null
    try {
      body = JSON.parse(raw)
    } catch {
      /* plain-text error bodies from some routes */
    }
    if (body && typeof body === 'object') {
      throw new ApiError(body.message ?? raw, {
        status: res.status,
        code: body.code,
      })
    }
    throw new ApiError(raw, res.status)
  }
  if (res.status === 204) return undefined
  return res.json()
}

/** Unwrap CONTEXT §29 `{ data, meta? }` success envelope. */
export async function apiData(path, init) {
  const body = await apiClient(path, init)
  if (body && typeof body === 'object' && 'data' in body) {
    return body
  }
  return { data: body }
}

export function isRealApiMode() {
  return API_MODE !== 'mock'
}
