import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { fetchTrackView, type TrackEvent, type TrackView } from '@/features/donations/track'
import { formatSessionWhenFromIso } from '@/lib/session-when'
import { cn } from '@/lib/utils'

/**
 * The §15 donor tracking page — `/give/track/:token`.
 *
 * Unauthenticated by design. The token in the path is the whole credential, which is why this
 * is deliberately NOT folded into `/me`: that page is Supabase-auth-scoped and belongs to the
 * account track. A donor never needs an account to see where their money went.
 */
/**
 * The token lives in the URL, so the URL *is* the credential. Two ways it escapes, both
 * closed here for the lifetime of this page only:
 *
 *  - **Indexing.** The server sets `X-Robots-Tag: noindex` on the API response, but a crawler
 *    never fetches the API — it fetches this HTML page, which the Vite/static host serves with
 *    no such header. The header therefore protected the JSON and not the thing being indexed.
 *  - **Referrer.** The footer links out (About Love 21, Annual Report). Under the default
 *    `strict-origin-when-cross-origin` those are same-origin-safe, but any in-page link to
 *    another origin would put the full tracking URL in that site's logs.
 *
 * Both tags are removed on unmount so they never apply to the rest of the SPA — a global
 * noindex in index.html would deindex the whole charity site.
 */
function useProtectedFromLeaking() {
  useEffect(() => {
    const tags = [
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'referrer', content: 'no-referrer' },
    ].map(({ name, content }) => {
      const el = document.createElement('meta')
      el.setAttribute('name', name)
      el.setAttribute('content', content)
      document.head.appendChild(el)
      return el
    })
    return () => tags.forEach((el) => el.remove())
  }, [])
}

export function DonorTrackPage() {
  const { t, locale } = useSite()
  const g = t.give
  const { token = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const periodId = params.get('period')

  const [view, setView] = useState<TrackView | null>(null)
  const [failed, setFailed] = useState(false)

  useProtectedFromLeaking()

  useEffect(() => {
    let cancelled = false
    setFailed(false)
    void (async () => {
      try {
        const next = await fetchTrackView(token, periodId)
        if (!cancelled) setView(next)
      } catch {
        // A bad token and a server error look the same to the donor on purpose — a distinct
        // "no such donor" message would confirm whether a guessed token exists.
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, periodId])

  if (failed) {
    return (
      <Shell>
        <p className="mt-6 rounded-xl border border-navy/10 bg-white p-5 text-[15px] leading-relaxed text-navy/75">
          {g.trackNotFound}
        </p>
      </Shell>
    )
  }

  if (!view) {
    return (
      <Shell>
        <p className="mt-6 text-[15px] text-navy/60">{g.trackLoading}</p>
      </Shell>
    )
  }

  const { donor, lifetime, period, periods } = view
  const since = donor.supporter_since
    ? new Date(donor.supporter_since).toLocaleDateString(
        locale === 'en' ? 'en-GB' : 'zh-HK',
        { year: 'numeric', month: 'long', timeZone: 'Asia/Hong_Kong' },
      )
    : null

  return (
    <Shell>
      {donor.full_name ? (
        <p className="mt-3 text-lg font-semibold text-navy/70">{donor.full_name}</p>
      ) : null}
      {since ? (
        <p className="mt-1 text-[14px] text-navy/55">
          {g.trackSupporterSince.replace('{date}', since)}
        </p>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label={g.trackTotalGiven} value={`HK$${lifetime.total_given_hkd.toLocaleString()}`} />
        <Stat label={g.trackDonationCount} value={String(lifetime.donation_count)} />
        <Stat label={g.trackSessionsSupported} value={String(lifetime.sessions_supported)} />
        <Stat label={g.trackSessionsOnTheWay} value={String(lifetime.sessions_on_the_way)} />
        <Stat label={g.trackPeopleReached} value={String(lifetime.people_reached)} />
      </dl>

      {period ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-navy">
            {g.trackCurrentEdition}
          </h2>
          <p className="mt-1 text-[14px] text-navy/60">
            {/* When the donor next hears from us — not a window. The period's date range is a
                batching rule and says nothing about the sessions below, which are chosen by a
                different rule entirely; showing it here read as a claim about them. */}
            {(period.is_current ? g.trackNextUpdate : g.trackUpdateSent).replace(
              '{date}',
              period.label,
            )}
            {period.events_credited
              ? ` · ${g.trackCredited.replace('{count}', String(period.events_credited))}`
              : ''}
          </p>

          {period.events.length ? (
            <ul className="mt-6 space-y-3">
              {period.events.map((event) => (
                <EventRow key={event.id} event={event} g={g} locale={locale} />
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-xl border border-navy/10 bg-white p-5 text-[15px] text-navy/70">
              {g.trackNoEvents}
            </p>
          )}
        </section>
      ) : null}

      {periods.length > 1 ? (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold text-navy">{g.trackArchive}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {periods.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setParams(p.id === period?.id ? {} : { period: p.id })}
                className={cn(
                  'min-h-11 rounded-full border px-4 text-sm font-semibold',
                  p.id === period?.id
                    ? 'border-navy bg-navy text-white'
                    : 'border-navy/20 text-navy hover:border-navy',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useSite()
  const g = t.give
  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="kicker text-teal">{g.trackKicker}</p>
        <h1 className="mt-3 font-display text-[clamp(1.75rem,5vw,2.5rem)] font-semibold text-navy">
          {g.trackTitle}
        </h1>
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white p-4">
      <dt className="text-[12px] font-semibold tracking-wide text-navy/55 uppercase">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-semibold text-navy">{value}</dd>
    </div>
  )
}

function EventRow({
  event,
  g,
  locale,
}: {
  event: TrackEvent
  g: Record<string, string>
  locale: 'en' | 'zh-Hant' | 'zh-Hans'
}) {
  const when = formatSessionWhenFromIso(event.starts_at)[locale]
  const statusLabel =
    event.status === 'completed'
      ? g.trackStatusCompleted
      : event.status === 'cancelled'
        ? g.trackStatusCancelled
        : g.trackStatusScheduled

  // Completed sessions report who actually came; scheduled ones report the planned headcount.
  // Never collapse the two — a completed event's turnout must stay a fact, not become a plan.
  const headcount =
    event.status === 'completed'
      ? event.attendance_count != null
        ? g.trackAttended.replace('{count}', String(event.attendance_count))
        : null
      : event.expected_participants != null
        ? g.trackExpected.replace('{count}', String(event.expected_participants))
        : null

  return (
    <li
      className={cn(
        'rounded-xl border border-navy/10 bg-white p-4',
        event.status === 'cancelled' && 'opacity-60',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-navy">{event.title ?? '—'}</p>
        <span
          className={cn(
            'shrink-0 rounded-md px-2.5 py-1 text-[12px] font-semibold',
            event.status === 'completed'
              ? 'bg-teal/15 text-teal'
              : event.status === 'cancelled'
                ? 'bg-red/10 text-red'
                : 'bg-amber text-navy',
          )}
        >
          {statusLabel}
        </span>
      </div>
      <p className="mt-2 text-[14px] text-navy/65">
        {when}
        {event.location ? ` · ${event.location}` : ''}
      </p>
      {headcount ? <p className="mt-1 text-[13px] text-navy/55">{headcount}</p> : null}
      {event.photo_url ? (
        <img
          src={event.photo_url}
          alt=""
          className="mt-3 max-h-48 w-full rounded-lg object-cover"
        />
      ) : null}
    </li>
  )
}
