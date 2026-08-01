import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import {
  createDonation,
  getCampaign,
  rememberMyCampaign,
  type LocalCampaign,
} from '@/features/donations/api'
import { CampaignProgress } from '@/features/donations/components/campaign-progress'
import { ImpactLadder } from '@/features/donations/components/impact-ladder'
import { trackEvent } from '@/lib/analytics'

export function CampaignPublicPage() {
  const { slug = '' } = useParams()
  const { t } = useSite()
  const g = t.give
  const navigate = useNavigate()
  const [showDonate, setShowDonate] = useState(false)
  const [campaign, setCampaign] = useState<LocalCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [donating, setDonating] = useState(false)
  const [donateError, setDonateError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getCampaign(slug)
      .then((data) => {
        if (data) rememberMyCampaign(data.slug)
        setCampaign(data ?? null)
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <SkipLink />
        <SiteHeader />
        <main id="main" className="mx-auto max-w-2xl px-4 py-16 text-navy/70">
          …
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

  async function handleDonate({
    amount,
    email,
    frequency,
    programme,
  }: {
    amount: number
    email: string
    frequency: 'once' | 'weekly' | 'monthly'
    programme: Parameters<typeof createDonation>[0]['programme']
  }) {
    setDonateError(null)
    setDonating(true)
    trackEvent('donate_click', {
      amount,
      frequency,
      programme,
      campaign: slug,
    })
    try {
      await createDonation({
        amount_hkd: amount,
        email,
        frequency,
        programme,
        campaign_slug: slug,
      })
      const params = new URLSearchParams({
        amount: String(amount),
        campaign: slug,
      })
      if (email) params.set('email', email)
      navigate(`/give/thanks?${params}`)
    } catch (error) {
      setDonateError(error instanceof Error ? error.message : 'Donation failed')
    } finally {
      setDonating(false)
    }
  }

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
          {campaign.status === 'rejected' && (
            <p className="mb-4 inline-flex rounded-md bg-red/10 px-3 py-1.5 text-[13px] font-semibold text-red">
              Rejected
            </p>
          )}
          <h1 className="font-display text-[clamp(1.85rem,5vw,3rem)] font-semibold text-navy">
            {campaign.title}
          </h1>
          <p className="mt-4 whitespace-pre-wrap text-[16px] leading-relaxed text-navy/80">
            {campaign.story}
          </p>

          <div className="mt-8">
            <CampaignProgress raised={campaign.raised_hkd} goal={campaign.goal_hkd} />
          </div>

          <button
            type="button"
            disabled={campaign.status !== 'approved'}
            onClick={() => setShowDonate(true)}
            className="mt-8 hidden min-h-12 items-center justify-center rounded-md bg-red px-6 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
          >
            {g.campaignDonate}
          </button>

          {showDonate && (
            <div className="mt-10">
              {donateError && (
                <p role="alert" className="mb-4 rounded-xl bg-red/10 px-4 py-3 text-sm text-red">
                  {donateError}
                </p>
              )}
              <ImpactLadder onDonate={handleDonate} donating={donating} />
            </div>
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white p-3 sm:hidden">
        <button
          type="button"
          disabled={campaign.status !== 'approved'}
          onClick={() => setShowDonate(true)}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-red text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {g.stickyDonate}
        </button>
      </div>

      <SiteFooter />
    </div>
  )
}
