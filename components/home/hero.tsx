'use client'

import { ArrowDown } from 'lucide-react'
import { useSite } from '@/components/site-provider'

export function Hero() {
  const { t } = useSite()

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16">
        <p className="kicker text-teal">{t.hero.eyebrow}</p>
        <h1 className="mt-4 font-display text-6xl leading-[0.98] font-bold text-navy sm:text-8xl">
          {t.hero.title}
        </h1>
        <p className="mt-6 max-w-xl text-xl leading-relaxed text-ink/90">
          {t.hero.subhead}
        </p>
        <a
          href="#stats"
          className="mt-9 inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-navy px-7 text-lg font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t.hero.cta}
          <ArrowDown className="h-5 w-5" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
