import { Link } from 'react-router-dom'
import { GrowingTree } from '@/features/donations/components/gift-journey-tree'
import type { MeImpactGarden } from '@/features/me/impact'
import { useSite } from '@/components/site-provider'

/**
 * Combined-story garden — learn → volunteer → give (money + items).
 * Distinct from Giving’s per-gift tree: one cumulative picture across pillars.
 */
export function ImpactGarden({ garden }: { garden: MeImpactGarden }) {
  const { t } = useSite()
  const m = t.me

  return (
    <section aria-labelledby="impact-garden-title">
      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-gradient-to-br from-teal/[0.07] via-white to-navy/[0.03]">
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
          <div className="flex flex-col items-center rounded-xl bg-gradient-to-b from-teal/5 to-[#e8dcc8]/50 px-5 pt-4 pb-3">
            <GrowingTree level={garden.level} fruitCount={garden.fruit_count} />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="kicker text-teal">{m.gardenKicker}</p>
            <h2
              id="impact-garden-title"
              className="mt-2 font-display text-2xl font-semibold text-navy sm:text-3xl"
            >
              {m.gardenTitle}
            </h2>
            <p className="mt-2 max-w-lg text-navy/70">{m.gardenBody}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:max-w-xl sm:grid-cols-4">
              <Stat label={m.gardenLearn} value={String(garden.education_count)} />
              <Stat
                label={m.gardenHours}
                value={`${garden.hours_total}h`}
              />
              <Stat
                label={m.journeyGrowthTotalGiven}
                value={`HK$${garden.total_given_hkd.toLocaleString()}`}
              />
              <Stat label={m.gardenItems} value={String(garden.item_pledges)} />
            </dl>
            <p className="mt-4 text-sm text-navy/55">{m.gardenPillarHint}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
              <Link
                to="/news"
                className="text-sm font-semibold text-teal underline-offset-4 hover:underline"
              >
                {m.gardenLearnCta}
              </Link>
              <Link
                to="/volunteer"
                className="text-sm font-semibold text-teal underline-offset-4 hover:underline"
              >
                {m.gardenVolunteerCta}
              </Link>
              <Link
                to="/give"
                className="text-sm font-semibold text-teal underline-offset-4 hover:underline"
              >
                {m.gardenGiveCta}
              </Link>
              <Link
                to="/give?tab=wishlist"
                className="text-sm font-semibold text-teal underline-offset-4 hover:underline"
              >
                {m.gardenItemsCta}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/80 px-3 py-3">
      <dt className="text-[11px] font-semibold tracking-wide text-navy/45 uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-display text-xl font-semibold text-navy">{value}</dd>
    </div>
  )
}
