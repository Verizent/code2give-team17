import { Link } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { DemoBanner } from '@/features/donations/components/demo-banner'
import { CampaignForm } from '@/features/donations/components/campaign-form'

export function CampaignCreatePage() {
  const { t } = useSite()
  const g = t.give

  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          to="/give?tab=fundraise"
          className="inline-flex min-h-11 items-center text-[14px] font-semibold text-navy/70 underline-offset-4 hover:underline"
        >
          ← {g.tabFundraise}
        </Link>
        <h1 className="mt-6 font-display text-3xl font-semibold text-navy sm:text-4xl">
          {g.createCampaignCta}
        </h1>
        <div className="mt-4">
          <DemoBanner />
        </div>
        <p className="mt-3 text-[13px] font-medium text-navy/55">{g.fundraisePendingNote}</p>
        <div className="mt-8">
          <CampaignForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
