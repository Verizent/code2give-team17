import { apiData } from '@/lib/apiClient'

/** Mirrors services/auth/me.service.js — camelCase, not the raw `profiles` row. */
export type AuthProfile = {
  userId: string
  email: string | null
  fullName: string | null
  role: 'admin' | 'volunteer' | string
  locale: string | null
  volunteer: { linked: boolean; id?: string; fullName?: string | null; claimedAt?: string | null }
}

export async function fetchAuthMe(): Promise<AuthProfile> {
  const { data } = await apiData<AuthProfile>('/api/me')
  return data
}
