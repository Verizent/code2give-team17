import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { trackEvent } from '@/lib/analytics'
import { addDemoDonation } from '@/features/donations/api'
import { requestGiftJourneyNotify } from '@/features/donations/checkout'
import {
  advanceDonationStage,
  getDonation,
  updateDonationNotify,
  type JourneyStage,
  type StoredDonation,
} from '@/features/donations/donation-store'
import { cn } from '@/lib/utils'

const STAGES: JourneyStage[] = ['received', 'matched', 'session_update']

export function GiveThanksPage() {
  const { t } = useSite()
  const g = t.give
  const [params] = useSearchParams()
  const donationId = params.get('donation') || ''
  const legacyAmount = params.get('amount')
  const campaign = params.get('campaign')

  const [donation, setDonation] = useState<StoredDonation | undefined>(() =>
    donationId ? getDonation(donationId) : undefined,
  )
  const [email, setEmail] = useState(donation?.email || params.get('email') || '')
  const [notify, setNotify] = useState(donation?.journey_opt_in ?? true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (campaign && legacyAmount) {
      addDemoDonation(campaign, Number(legacyAmount) || 0)
    }
  }, [campaign, legacyAmount])

  useEffect(() => {
    if (!donation || !notify || !email.trim()) {
      setToast(null)
      return
    }
    let cancelled = false
    void (async () => {
      trackEvent('notify_opt_in', { email, donationId: donation.id })
      updateDonationNotify(donation.id, true, email)
      const result = await requestGiftJourneyNotify({
        email: email.trim().toLowerCase(),
        donation_id: donation.id,
        stage: donation.stage,
      })
      if (cancelled) return
      setToast(
        result === 'sent'
          ? g.thanksNotifyToast.replace('{email}', email)
          : g.journeyEmailNote.replace('{email}', email),
      )
    })()
    return () => {
      cancelled = true
    }
  }, [donation, notify, email, g.thanksNotifyToast, g.journeyEmailNote])

  function stageLabel(stage: JourneyStage) {
    if (stage === 'received') return g.journeyReceived
    if (stage === 'matched') return g.journeyMatched
    return g.journeySession
  }

  function advance() {
    if (!donation) return
    const next = advanceDonationStage(donation.id)
    if (next) setDonation({ ...next })
  }

  const amount = donation?.amount_hkd ?? (legacyAmount ? Number(legacyAmount) : undefined)
  const showJourney = Boolean(donation?.journey_opt_in && notify)
  const stageIndex = donation ? STAGES.indexOf(donation.stage) : 0

  const field =
    'mt-1 w-full rounded-md border border-black/12 bg-white px-3 py-3 text-[15px] text-navy outline-none focus:border-navy'

  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="mx-auto max-w-xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="kicker text-teal">{g.kicker}</p>
        <h1 className="mt-3 font-display text-[clamp(1.75rem,5vw,2.5rem)] font-semibold text-navy">
          {g.thanksAck}
        </h1>
        {amount ? (
          <p className="mt-3 text-lg font-semibold text-navy/70">
            HK${amount.toLocaleString()}
          </p>
        ) : null}

        <label className="mt-10 flex cursor-pointer gap-3 rounded-xl border border-black/8 bg-white p-4">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => {
              setNotify(e.target.checked)
              if (donation) updateDonationNotify(donation.id, e.target.checked, email)
            }}
            className="mt-1 h-5 w-5 accent-teal"
          />
          <span>
            <span className="block text-[15px] font-semibold text-navy">{g.journeyOptInLabel}</span>
            <span className="mt-1 block text-[13px] leading-relaxed text-navy/60">
              {g.journeyOptInHelper}
            </span>
          </span>
        </label>

        <div className="mt-6">
          <label className="text-[13px] font-semibold text-navy" htmlFor="thanks-email">
            {g.thanksEmail}
          </label>
          <input
            id="thanks-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
          />
        </div>

        {toast && (
          <p
            role="status"
            className="mt-4 rounded-md bg-teal/10 px-4 py-3 text-[14px] font-medium text-teal"
          >
            {toast}
          </p>
        )}

        {showJourney && donation && (
          <section className="mt-8 rounded-xl border border-navy/10 bg-white p-5">
            <h2 className="font-display text-xl font-semibold text-navy">{g.journeyTitle}</h2>
            <ol className="mt-5 space-y-3">
              {STAGES.map((stage, index) => {
                const done = index <= stageIndex
                return (
                  <li key={stage} className="flex items-center gap-3 text-sm font-semibold">
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-xs',
                        done ? 'bg-teal text-white' : 'bg-navy/10 text-navy/40',
                      )}
                    >
                      {done ? '✓' : index + 1}
                    </span>
                    <span className={done ? 'text-navy' : 'text-navy/40'}>{stageLabel(stage)}</span>
                  </li>
                )
              })}
            </ol>
            {donation.stage !== 'session_update' && (
              <button
                type="button"
                onClick={advance}
                className="mt-5 inline-flex min-h-11 items-center rounded-md border border-navy px-4 text-sm font-semibold text-navy"
              >
                {g.journeyAdvance}
              </button>
            )}
          </section>
        )}

        <nav className="mt-12 flex flex-wrap gap-x-6 gap-y-3 text-[14px] font-semibold">
          <Link
            to={`/login?redirect=${encodeURIComponent('/me?tab=giving')}&email=${encodeURIComponent(email)}`}
            className="text-navy underline-offset-4 hover:underline"
          >
            {g.thanksSaveImpact}
          </Link>
          <Link to="/volunteer" className="text-navy underline-offset-4 hover:underline">
            {g.thanksVolunteer}
          </Link>
          <Link to="/give?tab=fundraise" className="text-navy underline-offset-4 hover:underline">
            {g.thanksShareCampaign}
          </Link>
          <Link to="/" className="text-navy underline-offset-4 hover:underline">
            {g.thanksHome}
          </Link>
        </nav>
      </main>
      <SiteFooter />
    </div>
  )
}
