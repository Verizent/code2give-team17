import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BrandPatternBand, LovePatternBg } from '@/components/brand-pattern'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { useSite } from '@/components/site-provider'
import { SkipLink } from '@/components/skip-link'
import { ImpactLadder } from '@/features/donations/components/impact-ladder'
import { WishlistGrid } from '@/features/donations/components/wishlist-grid'
import {
  listApprovedCampaigns,
  listMyCampaigns,
  type Campaign,
  type CampaignStatus,
} from '@/features/donations/api'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

type GiveTab = 'money' | 'wishlist' | 'fundraise'

function statusLabel(
  status: CampaignStatus,
  g: { campaignPending: string; campaignApproved: string; campaignRejected: string },
) {
  if (status === 'approved') return g.campaignApproved
  if (status === 'rejected') return g.campaignRejected
  return g.campaignPending
}

function statusClass(status: CampaignStatus) {
  if (status === 'approved') return 'bg-teal/15 text-teal'
  if (status === 'rejected') return 'bg-red/10 text-red'
  return 'bg-amber text-navy'
}

export function GivePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useSite()
  const g = t.give
  const requestedTab = searchParams.get('tab')
  const tab: GiveTab =
    requestedTab === 'wishlist' || requestedTab === 'fundraise' ? requestedTab : 'money'
  const [liveCampaigns, setLiveCampaigns] = useState<Campaign[]>([])
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([])

  useEffect(() => {
    trackEvent('give_view', { tab })
  }, [tab])

  useEffect(() => {
    if (tab !== 'fundraise') return
    let cancelled = false
    void (async () => {
      try {
        const [live, mine] = await Promise.all([
          listApprovedCampaigns(),
          listMyCampaigns(),
        ])
        if (!cancelled) {
          setLiveCampaigns(live)
          setMyCampaigns(mine)
        }
      } catch {
        if (!cancelled) {
          setLiveCampaigns([])
          setMyCampaigns([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tab])

  const tabs: { id: GiveTab; label: string }[] = [
    { id: 'money', label: g.tabMoney },
    { id: 'wishlist', label: g.tabWishlist },
    { id: 'fundraise', label: g.tabFundraise },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <LovePatternBg variant="red">
          <div className="mx-auto max-w-[1120px] px-4 py-14 sm:px-8 sm:py-20">
            <p className="kicker text-yellow">{g.kicker}</p>
            <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.75rem)] font-semibold text-white">
              {g.title}
            </h1>
            <p className="section-lede section-lede-on-dark mt-5 max-w-xl text-base leading-relaxed text-white sm:text-lg">
              {g.subhead}
            </p>
          </div>
        </LovePatternBg>

        <BrandPatternBand variant="yellow" className="easy-hide" />

        <div className="sticky top-14 z-20 border-y border-navy/10 bg-white/95 backdrop-blur sm:top-[72px]">
          <div
            className="no-scrollbar mx-auto flex max-w-[1120px] gap-2 overflow-x-auto px-4 py-3 sm:px-8"
            role="tablist"
            aria-label="Ways to give"
          >
            {tabs.map((option) => (
              <button
                key={option.id}
                role="tab"
                aria-selected={tab === option.id}
                type="button"
                onClick={() => setSearchParams(option.id === 'money' ? {} : { tab: option.id })}
                className={cn(
                  'min-h-11 shrink-0 rounded-full px-6 text-sm font-semibold',
                  tab === option.id ? 'bg-navy text-white' : 'bg-white text-navy',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-8 sm:py-14">
          {tab === 'money' && (
            <ImpactLadder
              onDonated={(donationId) => {
                navigate(`/give/thanks?donation=${donationId}`)
              }}
            />
          )}
          {tab === 'wishlist' && <WishlistGrid />}
          {tab === 'fundraise' && (
            <section>
              <h2 className="font-display text-3xl font-semibold text-navy">{g.fundraiseTitle}</h2>
              <p className="mt-3 max-w-2xl text-navy/70">{g.fundraiseSubhead}</p>
              <ol className="mt-8 grid gap-4 sm:grid-cols-3">
                {g.fundraiseSteps.map((step, index) => (
                  <li key={step} className="rounded-2xl bg-white p-6">
                    <span className="font-display text-3xl font-semibold text-red">
                      {index + 1}
                    </span>
                    <p className="mt-3 font-semibold text-navy">{step}</p>
                  </li>
                ))}
              </ol>
              <Link
                to="/give/campaigns/new"
                className="mt-7 inline-flex min-h-12 items-center rounded-md bg-red px-6 font-semibold text-white"
              >
                {g.createCampaignCta}
              </Link>

              <h3 className="mt-14 font-display text-2xl font-semibold text-navy">
                {g.liveCampaigns}
              </h3>
              {liveCampaigns.length ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {liveCampaigns.map((campaign) => (
                    <Link
                      key={campaign.slug}
                      to={`/c/${campaign.slug}`}
                      className="flex gap-4 rounded-2xl bg-white p-4"
                    >
                      <img
                        src={campaign.cover}
                        alt=""
                        className="h-24 w-28 rounded-xl object-cover"
                      />
                      <div>
                        <p className="font-display text-lg font-semibold text-navy">
                          {campaign.title}
                        </p>
                        <p className="mt-2 text-sm text-navy/65">
                          HK${campaign.raised_hkd.toLocaleString()} / HK$
                          {campaign.goal_hkd.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl bg-white p-5 text-navy/70">{g.noLiveCampaigns}</p>
              )}

              <h3 className="mt-14 font-display text-2xl font-semibold text-navy">
                {g.yourCampaigns}
              </h3>
              {myCampaigns.length ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {myCampaigns.map((campaign) => (
                    <Link
                      key={campaign.slug}
                      to={`/c/${campaign.slug}`}
                      className="flex gap-4 rounded-2xl bg-white p-4"
                    >
                      <img
                        src={campaign.cover}
                        alt=""
                        className="h-24 w-28 rounded-xl object-cover"
                      />
                      <div>
                        <p
                          className={cn(
                            'inline-flex rounded-md px-2.5 py-1 text-[12px] font-semibold',
                            statusClass(campaign.status),
                          )}
                        >
                          {statusLabel(campaign.status, g)}
                        </p>
                        <p className="mt-2 font-display text-lg font-semibold text-navy">
                          {campaign.title}
                        </p>
                        <p className="mt-2 text-sm text-navy/65">
                          HK${campaign.raised_hkd.toLocaleString()} / HK$
                          {campaign.goal_hkd.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl bg-white p-5 text-navy/70">{g.noCampaigns}</p>
              )}
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
