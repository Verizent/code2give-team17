'use client'

import Link from 'next/link'
import { CalendarDays, MapPin, ArrowRight } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { activities, type Activity } from '@/lib/mock'
import { cn } from '@/lib/utils'

const accentBar: Record<Activity['accent'], string> = {
  teal: 'bg-teal',
  pink: 'bg-pink',
  yellow: 'bg-yellow',
  navy: 'bg-navy',
}

function ActivityCard({ activity }: { activity: Activity }) {
  const { locale, t } = useSite()
  const isVolunteer = activity.recruiting
  const href = isVolunteer ? '/volunteer' : '/community'

  return (
    <Link
      href={href}
      className="group relative flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-[320px]"
    >
      <span
        aria-hidden="true"
        className={cn('h-2 w-full', accentBar[activity.accent])}
      />
      <div className="flex flex-1 flex-col p-5">
        <span className="kicker text-teal">
          {activity.category[locale]}
        </span>
        <h3 className="mt-2 font-display text-2xl font-bold text-navy">
          {activity.title[locale]}
        </h3>
        <dl className="mt-4 flex flex-col gap-2 text-base text-ink/90">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-navy/60" aria-hidden="true" />
            <dd>{activity.date[locale]}</dd>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-navy/60" aria-hidden="true" />
            <dd>{activity.place[locale]}</dd>
          </div>
        </dl>

        <div className="mt-5 flex items-center justify-between">
          {isVolunteer ? (
            <span className="inline-flex items-center rounded-md bg-yellow/20 px-2.5 py-1 font-mono text-xs font-semibold tracking-wide text-navy">
              {t.activities.recruiting}
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-navy">
            {isVolunteer ? t.activities.joinCta : t.activities.viewCta}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
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

  return (
    <section aria-labelledby="activities-title" className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <span aria-hidden="true" className="block h-1 w-10 bg-red" />
        <h2
          id="activities-title"
          className="mt-4 font-display text-4xl font-bold text-navy sm:text-5xl"
        >
          {t.activities.title}
        </h2>
        <p className="mt-3 text-lg text-ink/75">{t.activities.subhead}</p>
      </div>

      <div className="relative mt-8">
        {/* edge fades */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-paper to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-paper to-transparent"
        />
        <ul className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-6">
          {activities.map((activity) => (
            <li key={activity.id} className="flex">
              <ActivityCard activity={activity} />
            </li>
          ))}
          <li aria-hidden="true" className="w-1 shrink-0" />
        </ul>
      </div>
    </section>
  )
}
