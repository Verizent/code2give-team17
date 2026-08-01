import { apiData } from '@/lib/apiClient'

export type AuthProfile = {
  id: string
  email: string | null
  full_name: string | null
  role: 'admin' | 'volunteer' | string
  locale: string | null
}

export async function fetchAuthMe(): Promise<AuthProfile> {
  const { data } = await apiData<AuthProfile>('/api/auth/me')
  return data
}
