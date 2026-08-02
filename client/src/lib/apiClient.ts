/**
 * Single integration point (CONTEXT §12).
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status = 500, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export async function apiClient<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const message =
      body && typeof body.message === 'string'
        ? body.message
        : res.statusText || 'Request failed'
    const code = body && typeof body.code === 'string' ? body.code : undefined
    throw new ApiError(message, res.status, code)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
