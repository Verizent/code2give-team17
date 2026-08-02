import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { apiData, isRealApiMode } from '@/lib/apiClient'
import { fetchOpportunity } from '@/features/volunteering/api'
import { getBriefing } from '@/features/volunteering/briefings'
import type { VolunteerOpportunity } from '@/features/volunteering/fixtures'
import {
  getSignup,
  type VolunteerSignup,
} from '@/features/volunteering/signup-store'

async function resolveSignup(signupId: string): Promise<VolunteerSignup | null> {
  const local = getSignup(signupId)
  if (local) return local

  if (!isRealApiMode()) return null

  try {
    const { data } = await apiData<{ items: Array<{ id: string; opportunity_id: string }> }>(
      '/api/volunteer-signups',
    )
    const row = (data?.items ?? []).find((item) => item.id === signupId)
    if (!row) return null
    return {
      id: row.id,
      opportunity_id: row.opportunity_id,
      name: '',
      email: '',
      age_group: 'age19_29',
      status: 'confirmed',
      created_at: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function VolunteerBriefingPage() {
  const { signupId } = useParams()
  const { locale, t } = useSite()
  const v = t.volunteer
  const [signup, setSignup] = useState<VolunteerSignup | null | undefined>(undefined)
  const [opportunity, setOpportunity] = useState<VolunteerOpportunity | null | undefined>(
    undefined,
  )

  useEffect(() => {
    if (!signupId) {
      setSignup(null)
      return
    }
    let cancelled = false
    void resolveSignup(signupId).then((row) => {
      if (!cancelled) setSignup(row)
    })
    return () => {
      cancelled = true
    }
  }, [signupId])

  useEffect(() => {
    if (signup === undefined) return
    if (!signup) {
      setOpportunity(null)
      return
    }
    let cancelled = false
    void fetchOpportunity(signup.opportunity_id).then((item) => {
      if (!cancelled) setOpportunity(item ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [signup])

  if (signup === undefined || opportunity === undefined) {
    return (
      <div className="min-h-screen bg-paper">
        <SiteHeader />
        <p className="mx-auto max-w-[720px] px-4 py-20 text-navy/60">{v.briefingTitle}…</p>
      </div>
    )
  }

  if (!signup) {
    return <Navigate to="/volunteer" replace />
  }

  const briefing = opportunity ? getBriefing(opportunity.id, opportunity) : undefined
  if (!opportunity || !briefing) {
    return (
      <div className="min-h-screen bg-paper">
        <SkipLink />
        <SiteHeader />
        <main id="main" className="mx-auto max-w-[720px] px-4 py-16 sm:px-6">
          <h1 className="font-display text-2xl font-semibold text-navy">{v.briefingTitle}</h1>
          <p className="mt-3 text-navy/70">
            {locale === 'en'
              ? 'We could not load this class briefing. The session may have been removed.'
              : locale === 'zh-Hans'
                ? '无法载入此课堂简介。该课堂可能已移除。'
                : '無法載入此課堂簡介。該課堂可能已移除。'}
          </p>
          <Link to="/volunteer" className="mt-6 inline-flex font-semibold text-teal underline-offset-4 hover:underline">
            {v.backToHub} →
          </Link>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="mx-auto max-w-[720px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="kicker text-teal">{v.briefingKicker}</p>
        <h1 className="mt-3 font-display text-[clamp(1.75rem,5vw,2.5rem)] font-semibold text-navy">
          {v.briefingTitle}
        </h1>
        <p className="mt-2 text-lg font-semibold text-navy">{opportunity.title[locale]}</p>
        <p className="mt-1 text-navy/65">{opportunity.when[locale]}</p>

        <dl className="mt-10 space-y-6">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <dt className="text-sm font-bold tracking-wide text-red uppercase">
              {v.briefingArrive}
            </dt>
            <dd className="mt-2 text-[15px] leading-relaxed text-navy/80">
              {briefing.arrive_by[locale]}
            </dd>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <dt className="text-sm font-bold tracking-wide text-red uppercase">
              {v.briefingMeet}
            </dt>
            <dd className="mt-2 text-[15px] leading-relaxed text-navy/80">
              {briefing.meeting_point[locale]}
            </dd>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <dt className="text-sm font-bold tracking-wide text-red uppercase">
              {v.briefingWear}
            </dt>
            <dd className="mt-2 text-[15px] leading-relaxed text-navy/80">
              {briefing.wear_bring[locale]}
            </dd>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <dt className="text-sm font-bold tracking-wide text-red uppercase">{v.briefingDo}</dt>
            <dd className="mt-2">
              <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-navy/80">
                {briefing.what_you_do.map((line) => (
                  <li key={line.en}>{line[locale]}</li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="rounded-2xl border border-red/20 bg-red/5 p-5">
            <dt className="text-sm font-bold tracking-wide text-red uppercase">
              {v.briefingEmergency}
            </dt>
            <dd className="mt-2 text-[15px] leading-relaxed text-navy/85">
              {briefing.emergency[locale]}
            </dd>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <dt className="text-sm font-bold tracking-wide text-navy/50 uppercase">
              {v.briefingCancel}
            </dt>
            <dd className="mt-2 text-[15px] leading-relaxed text-navy/80">
              {briefing.if_cannot_come[locale]}
            </dd>
          </div>
        </dl>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/give"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-red px-6 font-bold text-white"
          >
            {v.successGiveCta}
          </Link>
          <Link
            to="/volunteer"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-navy px-6 font-semibold text-navy"
          >
            {v.backToHub}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
