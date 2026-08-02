import { Link } from 'react-router-dom'
import { useSite } from '@/components/site-provider'
import type { VolunteerOpportunity } from '@/features/volunteering/fixtures'
import { cn } from '@/lib/utils'

function format(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  )
}

export function OpportunityCard({
  opportunity,
}: {
  opportunity: VolunteerOpportunity
}) {
  const { locale, t } = useSite()
  const v = t.volunteer
  const isFull = opportunity.spots_filled >= opportunity.capacity

  return (
    <Link
      to={`/volunteer/${opportunity.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(20,40,75,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-amber">
        <img
          src={opportunity.image}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        {opportunity.recruiting && !isFull ? (
          <span className="absolute top-3 left-3 rounded-full bg-yellow px-3 py-1 text-xs font-bold text-navy">
            {v.recruiting}
          </span>
        ) : isFull ? (
          <span className="absolute top-3 left-3 rounded-full bg-navy px-3 py-1 text-xs font-bold text-white">
            {v.fullBadge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase',
              opportunity.source === 'handson'
                ? 'bg-teal/10 text-teal'
                : 'bg-navy/8 text-navy',
            )}
          >
            {opportunity.source === 'handson' ? v.sourceHandson : v.sourceLove21}
          </span>
          <span className="text-xs font-semibold text-navy/55">
            {opportunity.programme[locale]}
          </span>
        </div>
        <h3 className="mt-3 font-display text-2xl leading-tight font-semibold text-navy">
          {opportunity.title[locale]}
        </h3>
        <p className="mt-3 text-sm font-medium text-navy/75">{opportunity.when[locale]}</p>
        <p className="mt-1 text-sm text-navy/55">{opportunity.place[locale]}</p>
        <p className="mt-4 border-t border-navy/8 pt-4 text-sm font-semibold text-navy/65">
          {format(v.spots, {
            filled: opportunity.spots_filled,
            capacity: opportunity.capacity,
          })}
        </p>
      </div>
    </Link>
  )
}
