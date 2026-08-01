import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { trackEvent } from '@/lib/analytics'
import { DemoBanner } from '@/features/donations/components/demo-banner'
import { addDemoDonation, demoAccountExists } from '@/features/donations/api'

export function GiveThanksPage() {
  const { t } = useSite()
  const g = t.give
  const [params] = useSearchParams()
  const initialEmail = params.get('email') || ''
  const amount = params.get('amount')
  const campaign = params.get('campaign')

  const [email, setEmail] = useState(initialEmail)
  const [notify, setNotify] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [dismissedAccount, setDismissedAccount] = useState(false)

  const hasAccount = demoAccountExists(email)

  useEffect(() => {
    if (campaign && amount) {
      addDemoDonation(campaign, Number(amount) || 0)
    }
  }, [campaign, amount])

  useEffect(() => {
    if (notify && email) {
      trackEvent('notify_opt_in', { email })
      setToast(g.thanksNotifyToast.replace('{email}', email))
    } else {
      setToast(null)
    }
  }, [notify, email, g.thanksNotifyToast])

  useEffect(() => {
    if (!dismissedAccount && !hasAccount && email) {
      trackEvent('account_prompt_shown', { email })
    }
  }, [dismissedAccount, hasAccount, email])

  const field =
    'mt-1 w-full rounded-md border border-black/12 bg-white px-3 py-3 text-[15px] text-navy outline-none focus:border-navy'

  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <DemoBanner />
      <main id="main" className="mx-auto max-w-xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="kicker text-teal">{g.kicker}</p>
        <h1 className="mt-3 font-display text-[clamp(1.75rem,5vw,2.5rem)] font-semibold text-navy">
          {g.thanksAck}
        </h1>

        <label className="mt-10 flex cursor-pointer gap-3 rounded-xl border border-black/8 bg-white p-4">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="mt-1 h-5 w-5 accent-teal"
          />
          <span>
            <span className="block text-[15px] font-semibold text-navy">{g.thanksNotifyLabel}</span>
            <span className="mt-1 block text-[13px] leading-relaxed text-navy/60">
              {g.thanksNotifyHelper}
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
          <p role="status" className="mt-4 rounded-md bg-teal/10 px-4 py-3 text-[14px] font-medium text-teal">
            {toast}
          </p>
        )}

        {notify && (
          <div className="mt-6 rounded-xl border border-dashed border-navy/20 bg-amber/50 p-4">
            <p className="text-[14px] leading-relaxed text-navy/80">{g.thanksSampleUpdate}</p>
            <p className="mt-2 text-[11px] font-semibold tracking-wide text-navy/40 uppercase">
              DEMO-ONLY
            </p>
          </div>
        )}

        {/* Soft account — never blocks giving */}
        {!dismissedAccount && email && (
          <div className="mt-10 rounded-xl border border-black/8 bg-white p-5 sm:p-6">
            {hasAccount ? (
              <>
                <p className="text-[15px] leading-relaxed text-navy/85">{g.thanksExistingBody}</p>
                <Link
                  to="/me"
                  className="mt-4 inline-flex min-h-11 items-center font-semibold text-teal underline-offset-4 hover:underline"
                >
                  {g.thanksViewGiving} →
                </Link>
              </>
            ) : (
              <>
                <p className="font-display text-lg font-semibold text-navy">{g.thanksCreateAccount}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-navy/70">
                  {g.thanksCreateAccountBody}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    console.log('[DEMO-ONLY] create account with', email)
                    setDismissedAccount(true)
                  }}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-navy px-5 text-[14px] font-semibold text-navy"
                >
                  {g.thanksCreateCta}
                </button>
                <button
                  type="button"
                  onClick={() => setDismissedAccount(true)}
                  className="mt-3 block min-h-11 text-[14px] font-medium text-navy/55 underline-offset-4 hover:underline"
                >
                  {g.thanksNoThanks}
                </button>
              </>
            )}
          </div>
        )}

        <nav className="mt-12 flex flex-wrap gap-x-6 gap-y-3 text-[14px] font-semibold">
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
