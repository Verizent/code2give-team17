import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, ArrowRight } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { loadOpportunities } from '@/features/volunteering/api'
import { activities } from '@/lib/mock'
import { cn } from '@/lib/utils'

const accentBar = {
  teal: 'bg-teal',
  pink: 'bg-pink',
  yellow: 'bg-yellow',
  navy: 'bg-navy',
}

const ACCENTS = ['pink', 'teal', 'navy', 'yellow']

function toActivity(opportunity, index) {
  return {
    id: opportunity.id,
    title: opportunity.title,
    date: opportunity.when,
    place: opportunity.place,
    category: opportunity.programme,
    recruiting: opportunity.recruiting,
    accent: ACCENTS[index % ACCENTS.length],
  }
}

function ActivityCard({ activity }) {
  const { locale, t } = useSite()
  const isVolunteer = activity.recruiting
  const href = isVolunteer ? `/volunteer/${activity.id}` : '/community'

  return (
    <Link
      to={href}
      className="group flex w-[min(280px,82vw)] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-black/8 bg-white shadow-[0_1px_2px_rgba(20,40,75,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(20,40,75,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span aria-hidden="true" className={cn('h-1.5 w-full', accentBar[activity.accent])} />
      <div className="flex flex-1 flex-col p-5">
        <span className="text-[12px] font-semibold tracking-wide text-teal uppercase">
          {activity.category[locale]}
        </span>
        <h3 className="mt-2 font-display text-[1.25rem] leading-snug font-semibold text-navy">
          {activity.title[locale]}
        </h3>
        <dl className="mt-4 flex flex-col gap-2 text-[14px] text-navy/70">
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-navy/40" aria-hidden="true" />
            <dd>{activity.date[locale]}</dd>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-navy/40" aria-hidden="true" />
            <dd>{activity.place[locale]}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-2 pt-5">
          {isVolunteer ? (
            <span className="rounded bg-yellow px-2 py-1 text-[11px] font-bold tracking-wide text-navy uppercase">
              {t.activities.recruiting}
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-navy">
            {isVolunteer ? t.activities.joinCta : t.activities.viewCta}
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  )
}

export function ActivityRow() {
  const { t } = useSite()
  const [items, setItems] = useState(activities)

  useEffect(() => {
    let cancelled = false
    void loadOpportunities()
      .then((opps) => {
        if (cancelled || opps.length === 0) return
        setItems(opps.slice(0, 5).map(toActivity))
      })
      .catch(() => {
        /* Keep mock activities when the opportunities API is down. */
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section aria-labelledby="activities-title" className="bg-amber py-16 sm:py-24">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <h2
          id="activities-title"
          className="font-display text-[clamp(2rem,4.5vw,2.75rem)] font-extrabold tracking-[-0.02em] text-navy"
        >
          {t.activities.title}
        </h2>
        <p className="section-lede mt-3 max-w-xl text-lg leading-relaxed font-medium text-navy/80 sm:text-xl">
          {t.activities.subhead}
        </p>
      </div>

      <div className="relative mt-8 sm:mt-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-4 bg-gradient-to-r from-amber to-transparent sm:w-10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-4 bg-gradient-to-l from-amber to-transparent sm:w-10"
        />
        <ul className="no-scrollbar mx-auto flex max-w-[1120px] snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:gap-5 sm:px-8">
          {items.map((activity) => (
            <li key={activity.id} className="flex">
              <ActivityCard activity={activity} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
