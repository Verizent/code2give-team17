/**
 * Single integration point for the Express API (CONTEXT.md §12 "the seam").
 * VITE_API_MODE toggles mock/real; features/*\/api.js branch on API_MODE and
 * fall back to fixtures so a missing/unreachable server never breaks a page.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
export const API_MODE = import.meta.env.VITE_API_MODE ?? 'mock'

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message ?? 'Request failed')
    this.status = status
    this.code = code
  }
}

/**
 * Backend locale enum is `en | zh-Hant` only (server/src/schemas/query.schema.js) —
 * no zh-Hans column exists, so simplified requests ask the API for zh-Hant instead.
 */
export function toApiLocale(locale) {
  return locale === 'zh-Hans' ? 'zh-Hant' : locale
}

/**
 * Fetches `path` and returns the parsed body as-is: `{ data }` or `{ data, meta }`
 * on success (CONTEXT.md §29 envelope) — callers destructure what they need.
 * Throws ApiError with `.status`/`.code` on any non-2xx response. `.message` may be
 * undefined outside development; never branch on it.
 */
export async function apiClient(path, init) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(body?.message, { status: res.status, code: body?.code })
  }

  return body
}
