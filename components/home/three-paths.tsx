'use client'

import Link from 'next/link'
import { Eye, HandHeart, Heart, ArrowRight } from 'lucide-react'
import { useSite } from '@/components/site-provider'

export function ThreePaths() {
  const { t } = useSite()

  const paths = [
    {
      key: 'witness',
      data: t.paths.witness,
      href: '/community',
      Icon: Eye,
      cardClass: 'bg-card border-border',
      iconClass: 'bg-teal/15 text-teal',
      ctaClass: 'text-navy',
    },
    {
      key: 'take',
      data: t.paths.take,
      href: '/volunteer',
      Icon: HandHeart,
      cardClass: 'bg-navy border-navy text-white',
      iconClass: 'bg-white/15 text-white',
      ctaClass: 'text-white',
    },
    {
      key: 'support',
      data: t.paths.support,
      href: '/give',
      Icon: Heart,
      cardClass: 'bg-card border-border',
      iconClass: 'bg-red/10 text-red',
      ctaClass: 'text-red',
    },
  ] as const

  return (
    <section aria-labelledby="paths-title" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <span aria-hidden="true" className="block h-1 w-10 bg-red" />
        <h2
          id="paths-title"
          className="mt-4 font-display text-4xl font-bold text-navy sm:text-5xl"
        >
          {t.paths.title}
        </h2>
        <p className="mt-3 text-lg text-ink/75">{t.paths.subhead}</p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {paths.map(({ key, data, href, Icon, cardClass, iconClass, ctaClass }) => {
            const isDark = key === 'take'
            return (
              <Link
                key={key}
                href={href}
                className={`group flex flex-col rounded-2xl border p-7 shadow-sm transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${cardClass}`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span
                  className={`kicker mt-5 ${isDark ? 'text-yellow' : 'text-teal'}`}
                >
                  {data.tag}
                </span>
                <h3
                  className={`mt-2 font-display text-3xl font-bold ${
                    isDark ? 'text-white' : 'text-navy'
                  }`}
                >
                  {data.title}
                </h3>
                <p
                  className={`mt-3 flex-1 text-base leading-relaxed ${
                    isDark ? 'text-white/85' : 'text-ink/85'
                  }`}
                >
                  {data.body}
                </p>
                <span
                  className={`mt-6 inline-flex items-center gap-2 text-base font-semibold ${ctaClass}`}
                >
                  {data.cta}
                  <ArrowRight
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
