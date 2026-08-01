import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '@/components/site-provider'
import { EasyReadRow, EasyReadSentences } from '@/components/easy-read-row'

/** Live “last updated Ns ago” — ticks every second, soft-resets at 30s (demo). */
function LiveSessionsChip() {
  const [ago, setAgo] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setAgo((n) => (n >= 30 ? 0 : n + 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="easy-hide mt-10 inline-flex max-w-full items-center gap-3.5 rounded-full bg-yellow px-4 py-3.5 shadow-sm sm:mt-12 sm:gap-4 sm:px-5 sm:py-4">
      <img src="/brand/logo.png?v=user-asset" alt="" className="h-10 w-auto shrink-0 sm:h-11" />
      <div className="min-w-0 pr-2 sm:pr-4">
        <p className="font-display text-[1.35rem] leading-none font-bold tracking-[-0.02em] text-navy sm:text-[1.6rem]">
          6,859 <span className="font-semibold">sessions</span>
        </p>
        <p className="mt-1.5 text-[12px] font-medium text-navy/65 sm:text-[13px]" aria-live="polite">
          last updated {ago}s ago
          <span className="text-navy/40"> · annual report 2024/25</span>
        </p>
      </div>
    </div>
  )
}

export function Hero() {
  const { t, easyRead } = useSite()

  if (easyRead) {
    return (
      <section className="relative bg-white">
        <div className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8 sm:py-14">
          <EasyReadRow
            imageSrc="/brand/hero-huddle.jpg"
            imageAlt="Love 21 members standing close together in a huddle"
            className="sm:grid-cols-[minmax(9rem,14rem)_minmax(0,1fr)]"
          >
            <p className="kicker text-red">{t.hero.eyebrow}</p>
            <h1 className="font-display text-navy">
              {t.hero.line1} {t.hero.line2}.
            </h1>
            <EasyReadSentences text={t.hero.subhead} />
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <a
                href="#ability"
                className="inline-flex min-h-[52px] items-center justify-center rounded-md bg-red px-6 text-[15px] font-bold text-white"
              >
                {t.hero.cta}
              </a>
              <Link
                to="/volunteer"
                className="inline-flex min-h-[52px] items-center font-semibold text-navy underline underline-offset-4"
              >
                {t.nav.volunteer}
              </Link>
            </div>
          </EasyReadRow>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative mx-auto grid max-w-[1120px] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)] lg:items-stretch">
        <div className="relative z-20 flex flex-col justify-center bg-white px-5 py-12 sm:px-8 sm:py-16 lg:py-20 lg:pr-6">
          <h1 className="font-display text-[clamp(2.75rem,7vw,5rem)] leading-[0.98] font-semibold tracking-[-0.03em] text-navy">
            {t.hero.line1} {t.hero.line2}.
          </h1>
          <p className="kicker mt-3 text-red">#Somuchability</p>
          <p className="hero-lede mt-5 max-w-[24rem] text-base leading-relaxed text-navy/75 sm:text-lg">
            {t.hero.subhead}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-10">
            <a
              href="#ability"
              className="inline-flex h-12 items-center justify-center rounded-md bg-red px-6 text-[15px] font-bold text-white shadow-sm hover:bg-red/90"
            >
              {t.hero.cta}
            </a>
            <Link
              to="/volunteer"
              className="inline-flex h-12 items-center justify-center rounded-md border border-red px-6 text-[15px] font-semibold text-red hover:bg-red/5"
            >
              {t.nav.volunteer}
            </Link>
          </div>

          <LiveSessionsChip />
        </div>

        {/* Photo + mockup white fade (no red panel) */}
        <div className="relative min-h-[320px] w-full bg-white sm:min-h-[420px] lg:min-h-[560px]">
          <img
            src="/brand/hero-huddle.jpg"
            alt="Love 21 members in a huddle together"
            className="absolute inset-0 h-full w-full object-cover object-center lg:object-[center_35%]"
          />
          {/* Soft white fade from left — matches mockup blend into copy column */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[55%] sm:w-[48%] lg:w-[42%]"
            style={{
              background:
                'linear-gradient(90deg, #ffffff 0%, #ffffff 28%, rgba(255,255,255,0.85) 48%, rgba(255,255,255,0.35) 72%, rgba(255,255,255,0) 100%)',
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[22%]"
            style={{
              background:
                'linear-gradient(0deg, #ffffff 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0) 100%)',
            }}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  )
}
