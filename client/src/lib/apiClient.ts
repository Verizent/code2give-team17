/**
 * Single integration point (CONTEXT §12).
 * DEMO-ONLY: currently returns fixtures. Swap to fetch(/api/...) later.
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.status = status
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
    throw new ApiError(await res.text().catch(() => res.statusText), res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
