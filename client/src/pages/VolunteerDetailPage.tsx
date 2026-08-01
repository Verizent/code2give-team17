import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { useSite } from '@/components/site-provider'
import { SkipLink } from '@/components/skip-link'
import { fetchOpportunity } from '@/features/volunteering/api'
import { InterestForm } from '@/features/volunteering/components/interest-form'
import { trackEvent } from '@/lib/analytics'

function format(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  )
}

export function VolunteerDetailPage() {
  const { id } = useParams()
  const { locale, t } = useSite()
  const v = t.volunteer
  const opportunity = id ? fetchOpportunity(id) : undefined
  const [showInterestForm, setShowInterestForm] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (opportunity) {
      trackEvent('volunteer_view', {
        page: 'detail',
        opportunityId: opportunity.id,
        source: opportunity.source,
      })
    }
  }, [opportunity])

  if (!opportunity) {
    return <Navigate to="/volunteer" replace />
  }

  const title = opportunity.title[locale]
  const finish = () => {
    setShowInterestForm(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-paper">
        <SkipLink />
        <SiteHeader />
        <main id="main">
          <section className="mx-auto flex min-h-[65vh] max-w-[760px] flex-col justify-center px-4 py-16 text-center sm:px-8 sm:py-24">
            <span
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow text-2xl font-bold text-navy"
              aria-hidden
            >
              ✓
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold text-navy sm:text-5xl">
              {format(v.successTitle, { session: title })}
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-lg text-navy/70">{v.successBody}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/give"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-red px-6 font-bold text-white"
              >
                {v.successGiveCta}
              </Link>
              <Link
                to="/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-navy px-6 font-semibold text-navy"
              >
                {v.successHome}
              </Link>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <section className="bg-paper">
          <div className="mx-auto max-w-[1120px] px-4 py-12 sm:px-8 sm:py-20">
            <Link
              to="/volunteer"
              className="inline-flex min-h-11 items-center text-sm font-bold text-teal hover:underline"
            >
              ← {v.backToHub}
            </Link>
            <div className="mt-7 grid gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-wide uppercase">
                  <span className="rounded-full bg-teal/10 px-3 py-1 text-teal">
                    {opportunity.source === 'handson'
                      ? v.sourceHandson
                      : v.sourceLove21}
                  </span>
                  <span className="text-navy/55">{opportunity.programme[locale]}</span>
                </div>
                <h1 className="mt-4 font-display text-[clamp(2.25rem,6vw,4rem)] leading-[1.05] font-semibold text-navy">
                  {title}
                </h1>
                <p className="mt-6 text-lg font-semibold text-navy">
                  {opportunity.when[locale]}
                </p>
                <p className="mt-1 text-navy/60">{opportunity.place[locale]}</p>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy/75">
                  {opportunity.description[locale]}
                </p>
              </div>
              <img
                src={opportunity.image}
                alt=""
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-[1120px] gap-12 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_380px] lg:gap-16">
          <div className="space-y-10">
            <section>
              <h2 className="font-display text-3xl font-semibold text-navy">{v.detailWhat}</h2>
              <p className="mt-4 text-lg leading-relaxed text-navy/75">
                {opportunity.whatYouDo[locale]}
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-navy">
                {v.detailEligibility}
              </h2>
              <p className="mt-4 text-navy/75">{opportunity.age_note[locale]}</p>
              <p className="mt-2 font-semibold text-navy">{opportunity.group_note[locale]}</p>
            </section>
            <p className="rounded-2xl bg-amber p-5 text-sm leading-relaxed text-navy/75">
              {v.detailSafeguard}
            </p>
          </div>

          <aside className="h-fit rounded-2xl border border-navy/10 bg-white p-6 shadow-[0_12px_35px_rgba(20,40,75,0.08)] sm:p-8">
            {opportunity.source === 'handson' ? (
              <>
                <p className="text-sm font-bold text-navy">
                  {format(v.handsonCapacity, {
                    filled: opportunity.spots_filled,
                    capacity: opportunity.capacity,
                    interested: opportunity.interested_count,
                  })}
                </p>
                {showInterestForm ? (
                  <div className="mt-6">
                    <InterestForm
                      opportunityId={opportunity.id}
                      onSuccess={finish}
                      onCancel={() => setShowInterestForm(false)}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowInterestForm(true)}
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-red px-5 font-bold text-white"
                  >
                    {v.registerInterest}
                  </button>
                )}
                {opportunity.external_url && (
                  <a
                    href={opportunity.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-navy px-5 text-center font-semibold text-navy"
                  >
                    {v.completeHandson} ↗
                  </a>
                )}
                <p className="mt-4 text-xs leading-relaxed text-teal">
                  DEMO-ONLY — interest is saved locally; HandsOn handles the real booking.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-navy/70">
                  {format(v.spots, {
                    filled: opportunity.spots_filled,
                    capacity: opportunity.capacity,
                  })}
                </p>
                {showInterestForm ? (
                  <div className="mt-6">
                    <InterestForm
                      opportunityId={opportunity.id}
                      onSuccess={finish}
                      onCancel={() => setShowInterestForm(false)}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowInterestForm(true)}
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-yellow px-5 font-bold text-navy"
                  >
                    {v.joinSession}
                  </button>
                )}
                <p className="mt-4 text-xs leading-relaxed text-teal">
                  DEMO-ONLY — no real booking is made.
                </p>
              </>
            )}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
