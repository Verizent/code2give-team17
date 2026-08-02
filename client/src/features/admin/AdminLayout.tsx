import { NavLink, Navigate, Outlet, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useAuth } from '@/features/auth/AuthProvider'
import { fetchAuthMe, type AuthProfile } from '@/features/auth/api'
import { useSite } from '@/components/site-provider'
import { ADMIN_AUTH_BYPASS, ApiError } from '@/lib/apiClient'
import { cn } from '@/lib/utils'

/**
 * Staff chrome + role gate. UX only — every /api/admin/* still requires
 * requireAuth + requireRole('admin') on the server (§12).
 */
export function AdminLayout() {
  const auth = useAuth()
  const { t } = useSite()
  const a = t.admin
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [profileError, setProfileError] = useState<'forbidden' | 'error' | null>(null)

  const NAV = [
    { to: '/admin', end: true, label: a.navOverview, hint: a.navOverviewHint },
    { to: '/admin/articles', end: false, label: a.navArticles, hint: a.navArticlesHint },
    { to: '/admin/campaigns', end: false, label: a.navCampaigns, hint: a.navCampaignsHint },
    { to: '/admin/moderation', end: false, label: a.navModeration, hint: a.navModerationHint },
  ]

  useEffect(() => {
    if (!auth.ready || (!auth.accessToken && !ADMIN_AUTH_BYPASS)) return
    let cancelled = false
    void fetchAuthMe()
      .then((me) => {
        if (!cancelled) {
          setProfile(me)
          setProfileError(
            String(me.role ?? '')
              .trim()
              .toLowerCase() === 'admin'
              ? null
              : 'forbidden',
          )
        }
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setProfileError('forbidden')
        } else {
          setProfileError('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [auth.ready, auth.accessToken])

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible') return
      if (!auth.accessToken && !ADMIN_AUTH_BYPASS) return
      void fetchAuthMe()
        .then((me) => {
          setProfile(me)
          setProfileError(
            String(me.role ?? '')
              .trim()
              .toLowerCase() === 'admin'
              ? null
              : 'forbidden',
          )
        })
        .catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [auth.accessToken])

  if (!auth.ready) {
    return (
      <div className="min-h-screen bg-paper">
        <SkipLink />
        <SiteHeader />
        <main id="main" className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-navy/70">…</p>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // DEMO-ONLY: with the bypass on there is no Supabase session to check, so the
  // server-stamped identity from X-Demo-Auth is the only gate — real version needs
  // this redirect unconditional (§19, §26).
  if (!auth.user && !ADMIN_AUTH_BYPASS) {
    return <Navigate to="/login?redirect=/admin" replace />
  }

  const isAdmin =
    String(profile?.role ?? '')
      .trim()
      .toLowerCase() === 'admin'

  if (profileError === 'forbidden' || (profile && !isAdmin)) {
    return (
      <div className="min-h-screen bg-paper">
        <SkipLink />
        <SiteHeader />
        <main id="main" className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <p className="kicker text-red">{a.kicker}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-navy">{a.accessDenied}</h1>
          <p className="mt-4 text-navy/75">{a.accessDeniedBody}</p>
          {profile && (
            <p className="mt-3 text-sm text-navy/55">
              {a.signedInAs
                .replace('{email}', profile.email ?? 'unknown')
                .replace('{role}', String(profile.role))}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              className="inline-flex min-h-11 font-semibold text-teal"
              onClick={() => void auth.signOut()}
            >
              {a.signOutRetry}
            </button>
            <Link to="/" className="inline-flex min-h-11 font-semibold text-navy/70">
              {a.backHome}
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-paper">
        <SkipLink />
        <SiteHeader />
        <main id="main" className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-navy/70">
            {profileError === 'error' ? a.verifyError : '…'}
          </p>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf7_0%,#f7f5f0_48%,#fffdf7_100%)]">
      <SkipLink />
      <SiteHeader />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:gap-10 lg:py-14">
        <aside className="lg:w-52 lg:shrink-0">
          <p className="kicker text-red">{a.kicker}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-navy">{a.hubTitle}</p>
          <p className="mt-1 text-sm text-navy/60">{profile.email}</p>
          <nav aria-label={a.hubTitle} className="mt-8 flex flex-row flex-wrap gap-1 lg:flex-col">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 flex-col justify-center rounded-md px-3 py-2 transition-colors lg:items-start',
                    isActive
                      ? 'bg-navy text-white'
                      : 'text-navy/75 hover:bg-navy/5 hover:text-navy',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span
                      className={cn(
                        'mt-0.5 hidden text-[11px] leading-snug lg:block',
                        isActive ? 'text-white/70' : 'text-navy/45',
                      )}
                    >
                      {item.hint}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main id="main" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}
