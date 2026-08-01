import { useEffect } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { setAuthTokenGetter } from '@/lib/apiClient'

/** Keeps apiClient's Bearer token in sync with the Supabase session. */
export function AuthTokenBridge() {
  const { accessToken } = useAuth()

  useEffect(() => {
    setAuthTokenGetter(() => accessToken)
    return () => setAuthTokenGetter(null)
  }, [accessToken])

  return null
}
