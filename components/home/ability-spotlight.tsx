'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { spotlights, type Spotlight } from '@/lib/mock'
import { cn } from '@/lib/utils'

const accentBlock: Record<Spotlight['accent'], string> = {
  teal: 'bg-teal text-white',
  pink: 'bg-pink text-ink',
  yellow: 'bg-yellow text-ink',
  navy: 'bg-navy text-white',
}

const avatarRing: Record<Spotlight['accent'], string> = {
  teal: 'bg-teal/15 text-teal',
  pink: 'bg-pink/25 text-ink',
  yellow: 'bg-yellow/30 text-ink',
  navy: 'bg-navy/10 text-navy',
}

function SpotlightCard({ item }: { item: Spotlight }) {
  const { locale, t } = useSite()

  return (
    <Link
      href="/community"
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {/* Achievement first */}
      <div className={cn('p-6', accentBlock[item.accent])}>
        <p className="font-display text-2xl leading-tight font-semibold text-balance">
          {item.achievement[locale]}
        </p>
      </div>

      {/* Then the person */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full font-display text-lg font-bold',
              avatarRing[item.accent],
            )}
            aria-hidden="true"
          >
            {item.name.charAt(0)}
          </span>
          <div>
            <p className="kicker text-teal">{t.spotlight.reveal}</p>
            <p className="mt-0.5 font-display text-lg font-bold text-navy">
              {item.name} · {item.category[locale]}
            </p>
          </div>
        </div>
        <p className="mt-4 text-base leading-relaxed text-ink/90">
          {item.detail[locale]}
        </p>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-navy">
          {t.spotlight.readMore}
          <ArrowUpRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  )
}

export function AbilitySpotlight() {
  const { t } = useSite()

  return (
    <section
      aria-labelledby="spotlight-title"
      className="bg-sage py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <span aria-hidden="true" className="block h-1 w-10 bg-red" />
        <h2
          id="spotlight-title"
          className="mt-4 font-display text-4xl font-bold text-navy sm:text-5xl"
        >
          {t.spotlight.title}
        </h2>
        <p className="mt-3 text-lg text-navy/70">{t.spotlight.subhead}</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {spotlights.map((item) => (
            <SpotlightCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
