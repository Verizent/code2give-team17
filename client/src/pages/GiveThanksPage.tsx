import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { trackEvent } from '@/lib/analytics'
import { addDemoDonation } from '@/features/donations/api'
import { fetchCheckoutStatus, type CheckoutStatus } from '@/features/donations/checkout'
import {
  getDonation,
  updateDonationNotify,
  type JourneyStage,
  type StoredDonation,
} from '@/features/donations/donation-store'
import { cn } from '@/lib/utils'

const STAGES: JourneyStage[] = ['received', 'matched', 'session_update']

/** How often to re-ask, and how long before we stop and tell the donor to refresh. */
const POLL_INTERVAL_MS = 1000
const POLL_CEILING_MS = 20000

/** Statuses that will never change again, so polling should stop. */
const TERMINAL = new Set(['succeeded', 'failed', 'refunded'])

/**
 * Polls `GET /api/donations/session/:id` until the webhook flips the donation to a terminal
 * status, or the ceiling is reached.
 *
 * Stripe returns the donor here the moment the card clears, but the row stays `pending` until
 * `checkout.session.completed` reaches our webhook — a separate hop whose timing we do not
 * control. The page therefore arrives before the data does and has to wait for it.
 *
 * `timedOut` is deliberately distinct from `failed`. Running out of patience says nothing about
 * whether the payment worked — Stripe already has the money by the time the donor lands here.
 * Telling someone their gift failed because our webhook was slow would be a lie, so the two
 * states get different copy.
 */
function useCheckoutStatus(sessionId: string) {
  const [status, setStatus] = useState<CheckoutStatus | null>(null)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const deadline = Date.now() + POLL_CEILING_MS

    async function poll() {
      try {
        const next = await fetchCheckoutStatus(sessionId)
        if (cancelled) return
        setStatus(next)
        if (TERMINAL.has(next.status)) return
      } catch {
        // A poll can 404 briefly if it races the donation insert. Keep going — the ceiling
        // below is what ends this, not the first error.
        if (cancelled) return
      }
      if (Date.now() >= deadline) {
        setTimedOut(true)
        return
      }
      timer = setTimeout(() => void poll(), POLL_INTERVAL_MS)
    }

    void poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [sessionId])

  return { status, timedOut }
}

export function GiveThanksPage() {
  const { t } = useSite()
  const g = t.give
  const [params] = useSearchParams()
  // Stripe sends the donor back with `?session_id=` (checkout.service.js success_url).
  // `?donation=` is the local/mock path, where the gift only ever existed in localStorage.
  const sessionId = params.get('session_id') || ''
  const donationId = params.get('donation') || ''
  const legacyAmount = params.get('amount')
  const campaign = params.get('campaign')

  const { status, timedOut } = useCheckoutStatus(sessionId)

  const [donation] = useState<StoredDonation | undefined>(() =>
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

  // Records the opt-in locally. This used to POST /api/donors/notify, which has never been a
  // route — every call 404'd and the "we'll email you" toast was shown regardless. There is no
  // per-gift email on the backend at all: the only sendEmail lives in period-close.service.js,
  // which runs on the 15th/EOM batch. So the copy now promises the batch, not an instant note.
  useEffect(() => {
    if (!donation || !notify || !email.trim()) {
      setToast(null)
      return
    }
    trackEvent('notify_opt_in', { email, donationId: donation.id })
    updateDonationNotify(donation.id, true, email)
    setToast(g.journeyEmailNote.replace('{email}', email))
  }, [donation, notify, email, g.journeyEmailNote])

  function stageLabel(stage: JourneyStage) {
    if (stage === 'received') return g.journeyReceived
    if (stage === 'matched') return g.journeyMatched
    return g.journeySession
  }

  const amount =
    status?.amount_hkd ?? donation?.amount_hkd ?? (legacyAmount ? Number(legacyAmount) : undefined)
  const credited = status?.events_credited ?? 0
  const creditedCopy =
    credited === 1
      ? g.thanksCreditedOne
      : g.thanksCreditedMany.replace('{count}', String(credited))
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

        {sessionId ? (
          <section
            aria-live="polite"
            className="mt-6 rounded-xl border border-navy/10 bg-white p-5"
          >
            {status?.status === 'succeeded' ? (
              <>
                <p className="font-display text-xl font-semibold text-navy">{creditedCopy}</p>
                {status.tracking_token ? (
                  <Link
                    to={`/give/track/${status.tracking_token}`}
                    className="mt-4 inline-flex min-h-11 items-center rounded-md bg-navy px-5 text-sm font-semibold text-white"
                  >
                    {g.thanksTrackCta}
                  </Link>
                ) : null}
              </>
            ) : status?.status === 'failed' || status?.status === 'refunded' ? (
              <p className="text-[15px] font-medium text-red">{g.thanksConfirmFailed}</p>
            ) : timedOut ? (
              <p className="text-[15px] leading-relaxed text-navy/70">{g.thanksConfirmSlow}</p>
            ) : (
              <p className="text-[15px] text-navy/70">{g.thanksConfirming}</p>
            )}
          </section>
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
            {/* The "advance stage" button lived here. It moved the tracker forward in
                localStorage on click, which looked like progress but reflected nothing —
                no session was matched, no email sent. Real progress arrives through the
                tracking page, driven by donation_allocations. */}
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
