import { Link } from 'react-router-dom'
import { ArrowRight, Flame, GraduationCap, Medal, Quote, Trophy } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { achievements, corporatePartnerNames, corporatePartners } from '@/lib/mock'

const ICONS = {
  medal: Medal,
  trophy: Trophy,
  'graduation-cap': GraduationCap,
  flame: Flame,
}

function AchievementItem({ item }) {
  const { locale } = useSite()
  const Icon = ICONS[item.icon]

  return (
    <div className="flex flex-col items-start gap-3 py-6 first:pt-0 lg:py-0 lg:pl-8 lg:first:pl-0">
      <Icon className="h-7 w-7 text-teal" aria-hidden="true" />
      <p className="font-display text-lg leading-snug font-bold text-navy text-balance">
        {item.headline[locale]}
      </p>
      {item.detail && <p className="text-sm text-navy/60">{item.detail[locale]}</p>}
    </div>
  )
}

function CorporateQuote({ partner }) {
  const { locale } = useSite()

  return (
    <figure className="flex flex-col gap-3">
      <Quote className="h-6 w-6 text-teal/50" aria-hidden="true" />
      <blockquote className="font-display text-lg leading-relaxed text-navy text-balance">
        "{partner.quote[locale]}"
      </blockquote>
      <figcaption className="text-sm font-semibold text-navy/70">
        {partner.attribution ? `${partner.attribution}, ${partner.org}` : partner.org}
      </figcaption>
    </figure>
  )
}

/**
 * "Achievements & Impact" — replaces the Coming Up activity row. Deliberately
 * NOT card-styled (banner + quote strip) so it reads as proof, not more feed.
 */
export function AchievementsBand() {
  const { t } = useSite()

  return (
    <section aria-labelledby="achievements-title" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <p className="kicker text-teal">{t.achievements.eyebrow}</p>
        <h2
          id="achievements-title"
          className="mt-2 font-display text-[clamp(2rem,4.5vw,2.75rem)] font-extrabold tracking-[-0.02em] text-navy"
        >
          {t.achievements.title}
        </h2>
        <p className="section-lede mt-3 max-w-xl text-lg leading-relaxed font-medium text-navy/80 sm:text-xl">
          {t.achievements.subhead}
        </p>

        <div className="mt-10 grid grid-cols-1 divide-y divide-navy/10 sm:mt-12 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {achievements.map((item) => (
            <AchievementItem key={item.id} item={item} />
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-sage/50 p-6 sm:mt-20 sm:p-10">
          <h3 className="font-display text-xl font-bold text-navy sm:text-2xl">
            {t.corporateImpact.title}
          </h3>
          <p className="mt-1 text-base text-navy/70">{t.corporateImpact.subhead}</p>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            {corporatePartners.map((partner) => (
              <CorporateQuote key={partner.id} partner={partner} />
            ))}
          </div>

          <div className="mt-10 border-t border-navy/10 pt-8">
            <p className="text-xs font-bold tracking-wide text-navy/50 uppercase">
              {t.corporateImpact.wallLabel}
            </p>
            <p className="mt-1 max-w-lg text-sm text-navy/60">{t.corporateImpact.wallSubhead}</p>
            <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
              {corporatePartnerNames.map((name) => (
                <li
                  key={name}
                  className="flex min-h-[64px] items-center justify-center rounded-xl border border-navy/10 bg-white px-3 text-center text-sm leading-tight font-bold text-navy/70 sm:text-base"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <Link
            to="/volunteer"
            className="mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-navy px-6 text-base font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            {t.corporateImpact.cta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
