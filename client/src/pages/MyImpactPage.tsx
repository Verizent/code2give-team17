import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LovePatternBg } from '@/components/brand-pattern'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { useAuth } from '@/features/auth/AuthProvider'
import { GiftJourneyTree } from '@/features/donations/components/gift-journey-tree'
import {
  listDonations,
  seedSampleGifts,
  type StoredDonation,
} from '@/features/donations/donation-store'
import { VolunteerProfilePanel } from '@/features/volunteering/components/volunteer-profile'
import {
  loadVolunteerProfile,
  type VolunteerProfile,
} from '@/features/volunteering/profile'
import { apiData, isRealApiMode } from '@/lib/apiClient'
import { cn } from '@/lib/utils'

type MeTab = 'volunteer' | 'giving'

type ApiDonation = {
  id: string
  amount_hkd: number
  frequency: string
  programme: string
  status: string
  created_at: string
}

type GiftRow = {
  id: string
  amount_hkd: number
  created_at: string
  stage: string
  programme?: string
  frequency?: string
  session_title?: string
  session_when?: string
}

function stageFromStatus(status: string) {
  if (status === 'matched' || status === 'completed') return 'matched'
  if (status === 'session_update') return 'session_update'
  return 'received'
}

export function MyImpactPage() {
  const { t } = useSite()
  const m = t.me
  const auth = useAuth()
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab: MeTab = requested === 'giving' ? 'giving' : 'volunteer'

  const [profile, setProfile] = useState<VolunteerProfile | null>(null)
  const [gifts, setGifts] = useState<GiftRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth.ready || !auth.user) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    void (async () => {
      const email = auth.user?.email?.toLowerCase() ?? null

      let nextProfile = await loadVolunteerProfile(email)
      if (email) {
        nextProfile = {
          ...nextProfile,
          email,
          name:
            nextProfile.name ??
            (auth.user?.user_metadata?.full_name as string | undefined) ??
            null,
          sessions: nextProfile.sessions.filter(
            (s) => !s.signup.email || s.signup.email === email,
          ),
        }
        nextProfile.session_count = nextProfile.sessions.length
      }

      if (isRealApiMode()) {
        try {
          const { data } = await apiData<{
            volunteer: { full_name: string | null; email: string } | null
            signups: Array<{
              id: string
              hours: number
              opportunity: {
                id: string
                title_en: string
                title_zh: string | null
                starts_at: string | null
                ends_at: string | null
                programme: string
              } | null
            }>
            interests: Array<{
              id: string
              message: string | null
              created_at: string
              opportunity: {
                id: string
                title_en: string
                title_zh: string | null
                starts_at: string | null
              } | null
            }>
            stats: {
              session_count: number
              hours_total: number
              programme_count: number
              interest_count: number
            }
          }>('/api/volunteer/me')

          if (data.volunteer || data.signups.length || data.interests?.length) {
            const local = await loadVolunteerProfile(email)
            nextProfile = {
              ...local,
              name: data.volunteer?.full_name ?? local.name,
              email: data.volunteer?.email ?? email,
              skills: local.skills,
              session_count: data.stats.session_count,
              hours_total: data.stats.hours_total,
              programme_count: data.stats.programme_count,
              sessions:
                data.signups.length > 0
                  ? data.signups.map((s) => ({
                      signup: {
                        id: s.id,
                        opportunity_id: s.opportunity?.id ?? '',
                        name: data.volunteer?.full_name ?? '',
                        email: data.volunteer?.email ?? email ?? '',
                        age_group: 'age19_29' as const,
                        status: 'confirmed' as const,
                        created_at: new Date().toISOString(),
                      },
                      title: {
                        en: s.opportunity?.title_en ?? 'Session',
                        'zh-Hant': s.opportunity?.title_zh ?? s.opportunity?.title_en ?? '課堂',
                        'zh-Hans': s.opportunity?.title_zh ?? s.opportunity?.title_en ?? '课堂',
                      },
                      when: {
                        en: s.opportunity?.starts_at
                          ? new Date(s.opportunity.starts_at).toLocaleString()
                          : 'Date TBC',
                        'zh-Hant': '日期待定',
                        'zh-Hans': '日期待定',
                      },
                      hours: s.hours,
                    }))
                  : local.sessions,
              interests: (data.interests ?? []).map((row) => ({
                id: row.id,
                message: row.message,
                title: {
                  en: row.opportunity?.title_en ?? 'Session',
                  'zh-Hant':
                    row.opportunity?.title_zh ?? row.opportunity?.title_en ?? '課堂',
                  'zh-Hans':
                    row.opportunity?.title_zh ?? row.opportunity?.title_en ?? '课堂',
                },
                when: {
                  en: row.opportunity?.starts_at
                    ? new Date(row.opportunity.starts_at).toLocaleString()
                    : 'Date TBC',
                  'zh-Hant': '日期待定',
                  'zh-Hans': '日期待定',
                },
              })),
            }
          }
        } catch {
          // Keep local profile when API is unreachable.
        }
      }

      let nextGifts: GiftRow[] = listDonations()
        .filter((d: StoredDonation) => !email || d.email === email)
        .map((d) => ({
          id: d.id,
          amount_hkd: d.amount_hkd,
          created_at: d.created_at,
          stage: d.stage,
          programme: d.programme,
          frequency: d.frequency,
          session_title: d.session_title,
          session_when: d.session_when,
        }))

      if (isRealApiMode()) {
        try {
          const { data } = await apiData<{ donations: ApiDonation[] }>('/api/donations/me')
          if (data.donations?.length) {
            nextGifts = data.donations.map((d) => ({
              id: d.id,
              amount_hkd: d.amount_hkd,
              created_at: d.created_at,
              stage: stageFromStatus(d.status),
              programme: d.programme,
              frequency: d.frequency,
            }))
          }
        } catch {
          // Keep local gifts.
        }
      }

      if (!cancelled) {
        setProfile(nextProfile)
        setGifts(nextGifts)
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [auth.ready, auth.user])

  const tabs: { id: MeTab; label: string }[] = [
    { id: 'volunteer', label: m.tabVolunteer },
    { id: 'giving', label: m.tabGiving },
  ]

  function loadSamples() {
    const email = auth.user?.email
    if (!email) return
    const seeded = seedSampleGifts(email)
    setGifts(
      seeded
        .filter((d) => d.email === email.toLowerCase())
        .map((d) => ({
          id: d.id,
          amount_hkd: d.amount_hkd,
          created_at: d.created_at,
          stage: d.stage,
          programme: d.programme,
          frequency: d.frequency,
          session_title: d.session_title,
          session_when: d.session_when,
        })),
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <LovePatternBg variant="teal">
          <div className="mx-auto max-w-[1120px] px-4 py-14 sm:px-8 sm:py-20">
            <p className="kicker text-yellow">{m.kicker}</p>
            <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.75rem)] font-semibold text-white">
              {m.title}
            </h1>
            <p className="section-lede section-lede-on-dark mt-5 max-w-xl text-base leading-relaxed text-white sm:text-lg">
              {m.subhead}
            </p>
            {auth.user && (
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/85">
                <span>
                  {m.hello} {auth.user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void auth.signOut()}
                  className="rounded-md border border-white/40 px-3 py-1.5 font-semibold text-white hover:bg-white/10"
                >
                  {m.logOut}
                </button>
              </div>
            )}
          </div>
        </LovePatternBg>

        {!auth.ready ? (
          <div className="mx-auto max-w-[1120px] px-4 py-14 sm:px-8">
            <p className="text-navy/55">{m.loading}</p>
          </div>
        ) : !auth.user ? (
          <div className="mx-auto max-w-[1120px] px-4 py-14 sm:px-8">
            <h2 className="font-display text-3xl font-semibold text-navy">{m.gateTitle}</h2>
            <p className="mt-3 max-w-xl text-navy/70">{m.gateBody}</p>
            <Link
              to="/login?redirect=/me"
              className="mt-8 inline-flex min-h-12 items-center rounded-md bg-red px-6 font-semibold text-white"
            >
              {m.gateCta}
            </Link>
          </div>
        ) : (
          <>
            <div className="sticky top-14 z-20 border-y border-navy/10 bg-white/95 backdrop-blur sm:top-[72px]">
              <div
                className="mx-auto flex max-w-[1120px] gap-2 px-4 py-3 sm:px-8"
                role="tablist"
                aria-label={m.title}
              >
                {tabs.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === option.id}
                    onClick={() =>
                      setParams(option.id === 'volunteer' ? {} : { tab: option.id })
                    }
                    className={cn(
                      'min-h-11 shrink-0 rounded-full px-6 text-sm font-semibold',
                      tab === option.id ? 'bg-navy text-white' : 'bg-white text-navy',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-8 sm:py-14">
              {tab === 'volunteer' &&
                (loading || !profile ? (
                  <p className="text-navy/55">{m.loading}</p>
                ) : (
                  <VolunteerProfilePanel
                    profile={profile}
                    onSkillsSaved={(skills) =>
                      setProfile((prev) => (prev ? { ...prev, skills } : prev))
                    }
                  />
                ))}

              {tab === 'giving' && (
                <section className="mt-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="font-display text-3xl font-semibold text-navy">
                        {m.givingTitle}
                      </h2>
                      <p className="mt-3 max-w-xl text-navy/70">{m.givingSubhead}</p>
                    </div>
                    <button
                      type="button"
                      onClick={loadSamples}
                      className="shrink-0 rounded-md border border-navy/20 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
                    >
                      {m.loadSampleGifts}
                    </button>
                  </div>
                  {loading ? (
                    <p className="mt-8 text-navy/55">{m.loading}</p>
                  ) : gifts.length === 0 ? (
                    <div className="mt-10">
                      <p className="text-navy/60">{m.givingEmpty}</p>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                          to="/give"
                          className="inline-flex min-h-12 items-center rounded-md bg-red px-6 font-semibold text-white"
                        >
                          {m.giveCta}
                        </Link>
                        <button
                          type="button"
                          onClick={loadSamples}
                          className="inline-flex min-h-12 items-center rounded-md border border-navy/20 px-6 font-semibold text-navy hover:bg-navy/5"
                        >
                          {m.loadSampleGifts}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <GiftJourneyTree gifts={gifts} />
                  )}
                </section>
              )}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
