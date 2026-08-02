import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { resolveSignup } from '@/features/volunteering/resolve-signup'

export function VolunteerSuccessPage() {
  const { t } = useSite()
  const v = t.volunteer
  const [params] = useSearchParams()
  const session = params.get('session') || 'this session'
  const signupId = params.get('signup')
  const isInterest = params.get('interest') === '1'

  // undefined = still checking, null = not ours.
  const [verified, setVerified] = useState<boolean | undefined>(undefined)

  /**
   * Everything on this page came from the query string, so /volunteer/success?session=
   * Anything&signup=whatever rendered a confirmed spot for a signup that never existed.
   * Resolve the id before claiming anything: the browser's own store, or the volunteer's
   * own signups from the API. A stranger's id resolves to neither.
   *
   * The interest flow has no id to check — it confirms a lead, not a spot — so it is let
   * through on the `interest` flag alone.
   */
  useEffect(() => {
    if (isInterest) {
      setVerified(true)
      return
    }
    if (!signupId) {
      setVerified(false)
      return
    }
    let cancelled = false
    void resolveSignup(signupId).then((row) => {
      if (!cancelled) setVerified(Boolean(row))
    })
    return () => {
      cancelled = true
    }
  }, [signupId, isInterest])

  if (verified === false) {
    return <Navigate to="/volunteer" replace />
  }

  if (verified === undefined) {
    return (
      <div className="min-h-screen bg-paper">
        <SkipLink />
        <SiteHeader />
        <main id="main" className="mx-auto max-w-2xl px-4 py-24 sm:px-6" aria-busy="true" />
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-2xl flex-col px-4 py-16 sm:px-6 sm:py-24">
        <p className="kicker text-teal">{v.kicker}</p>
        <h1 className="mt-3 font-display text-[clamp(1.85rem,5vw,2.75rem)] font-semibold text-navy">
          {v.successTitle.replace('{session}', session)}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-navy/75">{v.successBody}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {signupId && (
            <Link
              to={`/volunteer/briefing/${signupId}`}
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-navy px-6 text-[15px] font-bold text-white"
            >
              {v.successBriefingCta}
            </Link>
          )}
          <Link
            to="/give"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-red px-6 text-[15px] font-bold text-white hover:bg-red/90"
          >
            {v.successGiveCta}
          </Link>
          <Link
            to={`/login?redirect=/me&email=${encodeURIComponent(params.get('email') || '')}`}
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-navy px-6 text-[15px] font-semibold text-navy"
          >
            {v.successSaveCta}
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-navy/30 px-6 text-[15px] font-semibold text-navy"
          >
            {v.successHome}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
