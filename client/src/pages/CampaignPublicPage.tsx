import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { getCampaign, type Campaign } from '@/features/donations/api'
import { CampaignProgress } from '@/features/donations/components/campaign-progress'
import { ImpactLadder } from '@/features/donations/components/impact-ladder'

export function CampaignPublicPage() {
  const { slug = '' } = useParams()
  const { t } = useSite()
  const g = t.give
  const navigate = useNavigate()
  const [showDonate, setShowDonate] = useState(false)
  const [campaign, setCampaign] = useState<Campaign | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void getCampaign(slug).then((row) => {
      if (!cancelled) setCampaign(row ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (campaign === undefined) {
    return (
      <div className="min-h-screen bg-paper">
        <SkipLink />
        <SiteHeader />
        <main id="main" className="mx-auto max-w-2xl px-4 py-16">
          <p className="text-navy/70">…</p>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-paper">
        <SkipLink />
        <SiteHeader />
        <main id="main" className="mx-auto max-w-2xl px-4 py-16">
          <p className="text-navy/70">{g.campaignNotFound}</p>
          <Link
            to="/give?tab=fundraise"
            className="mt-6 inline-flex min-h-11 font-semibold text-teal"
          >
            ← {g.tabFundraise}
          </Link>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const isLive = campaign.status === 'approved'

  return (
    <div className="min-h-screen bg-paper pb-24 sm:pb-0">
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <div className="relative aspect-[21/9] max-h-[360px] w-full overflow-hidden bg-navy">
          <img src={campaign.cover} alt="" className="h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
          <div className="absolute right-4 bottom-4 rounded-md bg-yellow px-3 py-1.5 text-[12px] font-bold text-navy">
            Love 21
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          {campaign.status === 'pending_approval' && (
            <p className="mb-4 inline-flex rounded-md bg-amber px-3 py-1.5 text-[13px] font-semibold text-navy">
              {g.campaignPending}
            </p>
          )}
          {campaign.status === 'approved' && (
            <p className="mb-4 inline-flex rounded-md bg-teal/15 px-3 py-1.5 text-[13px] font-semibold text-teal">
              {g.campaignApproved}
            </p>
          )}
          {campaign.status === 'rejected' && (
            <p className="mb-4 inline-flex rounded-md bg-red/10 px-3 py-1.5 text-[13px] font-semibold text-red">
              {g.campaignRejected}
            </p>
          )}
          <h1 className="font-display text-[clamp(1.85rem,5vw,3rem)] font-semibold text-navy">
            {campaign.title}
          </h1>
          <p className="mt-4 whitespace-pre-wrap text-[16px] leading-relaxed text-navy/80">
            {campaign.story}
          </p>

          {campaign.status === 'pending_approval' && (
            <p className="mt-6 rounded-2xl bg-white p-5 text-navy/75">{g.campaignAwaitingApproval}</p>
          )}

          <div className="mt-8">
            <CampaignProgress raised={campaign.raised_hkd} goal={campaign.goal_hkd} />
          </div>

          {isLive && (
            <button
              type="button"
              onClick={() => setShowDonate(true)}
              className="mt-8 hidden min-h-12 items-center justify-center rounded-md bg-red px-6 text-[15px] font-bold text-white sm:inline-flex"
            >
              {g.campaignDonate}
            </button>
          )}

          {isLive && showDonate && (
            <div className="mt-10">
              <ImpactLadder
                campaignSlug={campaign.slug}
                onDonated={(donationId) => {
                  navigate(`/give/thanks?donation=${donationId}&campaign=${campaign.slug}`)
                }}
              />
            </div>
          )}
        </div>
      </main>

      {isLive && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white p-3 sm:hidden">
          <button
            type="button"
            onClick={() => setShowDonate(true)}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-red text-[15px] font-bold text-white"
          >
            {g.stickyDonate}
          </button>
        </div>
      )}

      <SiteFooter />
    </div>
  )
}
