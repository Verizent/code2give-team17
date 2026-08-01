import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

type AuthContextValue = {
  ready: boolean
  session: Session | null
  user: User | null
  configured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: {
    email: string
    password: string
    fullName: string
  }) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  accessToken: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured()
  const [ready, setReady] = useState(!configured)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!configured) return

    const supabase = getSupabase()
    let cancelled = false

    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setSession(data.session)
        setReady(true)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setReady(true)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [configured])

  async function signIn(email: string, password: string) {
    const { error } = await getSupabase().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw error
  }

  async function signUp(input: {
    email: string
    password: string
    fullName: string
  }) {
    const { data, error } = await getSupabase().auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        data: { full_name: input.fullName.trim() },
      },
    })
    if (error) throw error
    // Confirm-email projects return a user with no session until the link is clicked.
    return { needsEmailConfirmation: !data.session }
  }

  async function signOut() {
    if (!configured) return
    await getSupabase().auth.signOut()
  }

  const value: AuthContextValue = {
    ready,
    session,
    user: session?.user ?? null,
    configured,
    signIn,
    signUp,
    signOut,
    accessToken: session?.access_token ?? null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
