import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useAuth } from '@/features/auth/AuthProvider'
import { fetchAuthMe, type AuthProfile } from '@/features/auth/api'
import {
  listPendingCampaigns,
  moderateCampaign,
  type Campaign,
} from '@/features/donations/api'
import { ApiError } from '@/lib/apiClient'

export function AdminPage() {
  const auth = useAuth()
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [profileError, setProfileError] = useState<'forbidden' | 'error' | null>(null)
  const [pending, setPending] = useState<Campaign[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!auth.ready || !auth.accessToken) return
    let cancelled = false
    void fetchAuthMe()
      .then((me) => {
        if (!cancelled) {
          setProfile(me)
          setProfileError(me.role === 'admin' ? null : 'forbidden')
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

  async function refresh() {
    try {
      setPending(await listPendingCampaigns())
      setError(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setProfileError('forbidden')
      } else {
        setError('Could not load pending campaigns.')
      }
      setPending([])
    }
  }

  useEffect(() => {
    if (profile?.role !== 'admin') return
    void refresh()
  }, [profile?.role])

  async function decide(id: string, status: 'approved' | 'rejected') {
    setBusyId(id)
    setError(null)
    try {
      await moderateCampaign(id, status)
      await refresh()
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setProfileError('forbidden')
      } else {
        setError('Could not update campaign status.')
      }
    } finally {
      setBusyId(null)
    }
  }

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

  if (!auth.user) {
    return <Navigate to="/login?redirect=/admin" replace />
  }

  if (profileError === 'forbidden' || (profile && profile.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-paper">
        <SkipLink />
        <SiteHeader />
        <main id="main" className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <p className="kicker text-red">Staff</p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-navy">Access denied</h1>
          <p className="mt-4 text-navy/75">
            This area needs an admin account. Sign in with a staff login, or ask a teammate to set
            your <code className="text-sm">profiles.role</code> to <code className="text-sm">admin</code>.
          </p>
          <Link to="/" className="mt-8 inline-flex min-h-11 font-semibold text-teal">
            ← Home
          </Link>
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
            {profileError === 'error' ? 'Could not verify admin role.' : '…'}
          </p>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="kicker text-red">Staff</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-navy sm:text-5xl">
          Admin Studio
        </h1>
        <p className="section-lede mt-4 max-w-2xl text-lg text-navy/75">
          Approve fundraisers before they appear in the public list.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-navy">Fundraiser approval</h2>
          <p className="mt-2 text-navy/70">
            Pending → approved (listed publicly) or rejected.
          </p>
          {error && (
            <p role="alert" className="mt-4 rounded-md bg-red/10 px-3 py-2 text-sm text-red">
              {error}
            </p>
          )}
          {pending.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-border bg-white p-6 text-navy/70">
              No campaigns waiting for approval.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {pending.map((campaign) => (
                <li
                  key={campaign.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center"
                >
                  <img
                    src={campaign.cover}
                    alt=""
                    className="h-24 w-32 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xl font-semibold text-navy">{campaign.title}</p>
                    <p className="mt-1 text-sm text-navy/60">
                      Goal HK${campaign.goal_hkd.toLocaleString()} · ends {campaign.end_date}
                    </p>
                    <Link
                      to={`/c/${campaign.slug}`}
                      className="mt-2 inline-flex text-sm font-semibold text-teal underline-offset-4 hover:underline"
                    >
                      Preview page
                    </Link>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={busyId === campaign.id}
                      onClick={() => void decide(campaign.id, 'approved')}
                      className="min-h-11 rounded-md bg-teal px-4 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === campaign.id}
                      onClick={() => void decide(campaign.id, 'rejected')}
                      className="min-h-11 rounded-md border border-navy/20 px-4 text-sm font-semibold text-navy disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            {
              title: 'Proof queue',
              body: 'Consent state · blur unconsented · Approve fans out.',
            },
            {
              title: 'Sessions',
              body: 'Bulk attendance · recruiting flags for the Home rail.',
            },
            {
              title: 'Funnel',
              body: 'Visitor → volunteer → donor. Colour + label, not colour alone.',
            },
          ].map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-border bg-white p-6"
            >
              <h2 className="font-display text-xl font-semibold text-navy">{card.title}</h2>
              <p className="mt-3 text-navy/70">{card.body}</p>
              <p className="mt-6 text-sm font-bold text-red">Shell · not live yet</p>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
