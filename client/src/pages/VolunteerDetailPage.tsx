import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { useSite } from '@/components/site-provider'
import { SkipLink } from '@/components/skip-link'
import { fetchOpportunity } from '@/features/volunteering/api'
import { InterestForm } from '@/features/volunteering/components/interest-form'
import { ShortSignupForm } from '@/features/volunteering/components/short-signup-form'
import type { VolunteerOpportunity } from '@/features/volunteering/fixtures'
import { isOpportunityFull } from '@/features/volunteering/signup-store'
import { trackEvent } from '@/lib/analytics'

function format(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  )
}

export function VolunteerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { locale, t } = useSite()
  const v = t.volunteer
  const [opportunity, setOpportunity] = useState<VolunteerOpportunity | null | undefined>(
    undefined,
  )
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!id) {
      setOpportunity(null)
      return
    }
    let cancelled = false
    void fetchOpportunity(id).then((item) => {
      if (!cancelled) setOpportunity(item ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (opportunity) {
      trackEvent('volunteer_view', {
        page: 'detail',
        opportunityId: opportunity.id,
        source: opportunity.source,
      })
    }
  }, [opportunity])

  if (opportunity === undefined) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
        <p className="mx-auto max-w-[1120px] px-4 py-20 text-navy/60">{v.listTitle}…</p>
      </div>
    )
  }

  if (!opportunity) {
    return <Navigate to="/volunteer" replace />
  }

  const title = opportunity.title[locale]
  const full = isOpportunityFull(opportunity)

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
                  {full ? (
                    <span className="rounded-full bg-navy/10 px-3 py-1 text-navy">{v.fullBadge}</span>
                  ) : opportunity.recruiting ? (
                    <span className="rounded-full bg-yellow px-3 py-1 text-navy">{v.recruiting}</span>
                  ) : null}
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
              <p className="text-sm font-bold text-navy">
                {format(v.handsonCapacity, {
                  handson: opportunity.spots_filled_handson,
                  web: opportunity.local_signups_count,
                  left: Math.max(0, opportunity.capacity - opportunity.spots_filled),
                  capacity: opportunity.capacity,
                })}
              </p>
            ) : (
              <p className="text-sm font-semibold text-navy/70">
                {format(v.spots, {
                  filled: opportunity.spots_filled,
                  capacity: opportunity.capacity,
                })}
              </p>
            )}

            {showForm ? (
              <div className="mt-6">
                {/*
                  A seat to claim means a signup; nothing to claim means interest. Source
                  decides neither — it records where a listing came from, not whether it
                  can be booked.

                  A handson listing is one where registration is open on BOTH their site
                  and ours, which is the whole reason spots_filled_handson and our own
                  signups are counted separately and summed. Sending every handson listing
                  to the interest form made its free seats unbookable here, and contradicted
                  the "Also book on HandsOn (optional)" link rendered directly below.
                */}
                {full ? (
                  <InterestForm
                    opportunityId={opportunity.id}
                    onCancel={() => setShowForm(false)}
                    onSuccess={() =>
                      navigate(
                        `/volunteer/success?session=${encodeURIComponent(title)}&interest=1`,
                      )
                    }
                  />
                ) : (
                  <ShortSignupForm
                    opportunityId={opportunity.id}
                    full={full}
                    onCancel={() => setShowForm(false)}
                    onSuccess={(signupId) =>
                      navigate(
                        `/volunteer/success?session=${encodeURIComponent(title)}&signup=${signupId}`,
                      )
                    }
                  />
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-red px-5 font-bold text-white"
              >
                {full ? v.registerInterest : v.joinSession}
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
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
