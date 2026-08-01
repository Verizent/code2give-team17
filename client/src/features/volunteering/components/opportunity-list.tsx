import { useSite } from '@/components/site-provider'
import type { VolunteerOpportunity } from '@/features/volunteering/fixtures'
import { OpportunityCard } from '@/features/volunteering/components/opportunity-card'

export function OpportunityList({
  opportunities,
}: {
  opportunities: VolunteerOpportunity[]
}) {
  const { t } = useSite()

  return (
    <section aria-labelledby="opportunity-list-title">
      <h2
        id="opportunity-list-title"
        className="font-display text-3xl font-semibold text-navy sm:text-4xl"
      >
        {t.volunteer.listTitle}
      </h2>
      {opportunities.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-2xl bg-amber p-6 text-navy/75">
          {t.volunteer.emptyList}
        </p>
      )}
    </section>
  )
}
