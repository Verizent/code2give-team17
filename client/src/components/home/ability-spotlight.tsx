import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { EasyReadRow, EasyReadSentences } from '@/components/easy-read-row'
import { spotlights, type Spotlight } from '@/lib/mock'
import { cn } from '@/lib/utils'

const SPOTLIGHT_IMAGES = [
  '/brand/member.jpg',
  '/brand/class.jpg',
  '/brand/activity.jpg',
  '/brand/hero-group.jpg',
] as const

const accentBlock: Record<Spotlight['accent'], string> = {
  teal: 'bg-teal text-white',
  pink: 'bg-pink text-navy',
  yellow: 'bg-yellow text-navy',
  navy: 'bg-navy text-white',
}

const avatarRing: Record<Spotlight['accent'], string> = {
  teal: 'bg-teal/15 text-teal',
  pink: 'bg-pink/40 text-navy',
  yellow: 'bg-yellow/50 text-navy',
  navy: 'bg-navy/10 text-navy',
}

function SpotlightCard({ item }: { item: Spotlight }) {
  const { locale, t } = useSite()

  return (
    <Link
      to="/community"
      className="group flex flex-col overflow-hidden rounded-xl border border-black/8 bg-white shadow-[0_1px_2px_rgba(20,40,75,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(20,40,75,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className={cn('min-h-[7.5rem] p-5', accentBlock[item.accent])}>
        <p className="font-display text-[1.2rem] leading-snug font-semibold text-balance">
          {item.achievement[locale]}
        </p>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-bold',
              avatarRing[item.accent],
            )}
            aria-hidden="true"
          >
            {item.name.charAt(0)}
          </span>
          <div>
            <p className="text-[12px] font-semibold tracking-wide text-teal uppercase">
              {t.spotlight.reveal}
            </p>
            <p className="font-display text-[1.05rem] font-bold text-navy">
              {item.name} · {item.category[locale]}
            </p>
          </div>
        </div>
        <p className="mt-3 flex-1 text-[14px] leading-relaxed text-navy/75">
          {item.detail[locale]}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-navy">
          {t.spotlight.readMore}
          <ArrowUpRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  )
}

export function AbilitySpotlight() {
  const { t, easyRead, locale } = useSite()

  if (easyRead) {
    return (
      <section
        id="ability"
        aria-labelledby="spotlight-title"
        className="scroll-mt-24 bg-yellow py-12 sm:py-16"
      >
        <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
          <h2 id="spotlight-title" className="font-display font-bold text-navy">
            {t.spotlight.title}
          </h2>
          <EasyReadSentences text={t.spotlight.subhead} className="mt-2" />

          <div className="mt-10 space-y-10">
            {spotlights.map((item, i) => (
              <EasyReadRow
                key={item.id}
                imageSrc={SPOTLIGHT_IMAGES[i % SPOTLIGHT_IMAGES.length]}
                imageAlt={`${item.name}`}
              >
                <p className="kicker text-navy">
                  {t.spotlight.reveal} {item.name}
                </p>
                <h3 className="font-display text-navy">{item.achievement[locale]}</h3>
                <EasyReadSentences text={item.detail[locale]} />
                <Link
                  to="/community"
                  className="inline-flex min-h-[52px] items-center font-bold text-navy underline underline-offset-4"
                >
                  {t.spotlight.readMore}
                </Link>
              </EasyReadRow>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      id="ability"
      aria-labelledby="spotlight-title"
      className="scroll-mt-24 bg-yellow py-16 sm:py-24"
    >
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <h2
          id="spotlight-title"
          className="font-display text-[clamp(2rem,4.5vw,2.75rem)] font-extrabold tracking-[-0.02em] text-navy"
        >
          {t.spotlight.title}
        </h2>
        <p className="section-lede mt-3 max-w-xl text-lg leading-relaxed font-medium text-navy/80 sm:text-xl">
          {t.spotlight.subhead}
        </p>

        <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {spotlights.map((item) => (
            <SpotlightCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
