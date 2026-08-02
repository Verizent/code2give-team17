import { useEffect } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { setAuthTokenGetter } from '@/lib/apiClient'

/**
 * Keeps apiClient's Bearer token in sync with the Supabase session.
 * Set the getter during render (not only in an effect) so sibling routes
 * that fetch on mount never race StrictMode cleanup with a null token —
 * that showed up as a false "Access denied" on /admin.
 */
export function AuthTokenBridge() {
  const { accessToken } = useAuth()
  // Render-time set: siblings that fetch on mount must not race a null getter.
  setAuthTokenGetter(() => accessToken)

  useEffect(() => {
    // Re-apply after StrictMode cleanup (effect remounts without a re-render).
    setAuthTokenGetter(() => accessToken)
    return () => setAuthTokenGetter(null)
  }, [accessToken])

  return null
}
