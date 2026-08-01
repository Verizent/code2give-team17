import { Link } from 'react-router-dom'
import { useSite } from '@/components/site-provider'
import type { MeConversion } from '@/features/me/impact'

/** Soft next-step CTA on Overview — from hours or gift progress, not a gift list. */
export function ConversionTrigger({ conversion }: { conversion: MeConversion }) {
  const { t } = useSite()
  const m = t.me

  if (!conversion) return null

  let title = m.conversionMonthlyTitle
  let body = m.conversionMonthlyBody
  let cta = m.conversionMonthlyCta

  if (conversion.kind === 'term') {
    title = m.conversionTermTitle
    body = m.conversionTermBody
      .replace('{toward}', String(conversion.amount_toward_class_hkd ?? 0))
      .replace('{cost}', String(conversion.class_cost_hkd ?? 2500))
    cta = m.conversionTermCta
  } else if (conversion.kind === 'first_gift') {
    title = m.conversionFirstTitle
    body = m.conversionFirstBody.replace('{hours}', String(conversion.hours ?? 0))
    cta = m.conversionFirstCta
  } else if (conversion.id === 'hours_to_monthly') {
    title = m.conversionHoursTitle.replace('{hours}', String(conversion.hours ?? 0))
    body = m.conversionHoursBody
    cta = m.conversionMonthlyCta
  }

  return (
    <section
      aria-labelledby="conversion-title"
      className="mt-14 overflow-hidden rounded-2xl bg-navy px-6 py-8 text-white sm:px-10 sm:py-10"
    >
      <p className="text-xs font-semibold tracking-wide text-yellow uppercase">
        {m.conversionKicker}
      </p>
      <h2 id="conversion-title" className="mt-2 font-display text-3xl font-semibold">
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-white/80">{body}</p>
      <Link
        to={conversion.cta_path}
        className="mt-6 inline-flex min-h-12 items-center justify-center rounded-md bg-red px-6 font-semibold text-white hover:bg-red/90"
      >
        {cta}
      </Link>
    </section>
  )
}
