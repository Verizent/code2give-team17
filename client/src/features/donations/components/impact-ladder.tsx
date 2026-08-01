import { useEffect, useState } from 'react'
import { useSite } from '@/components/site-provider'
import { useAuth } from '@/features/auth/AuthProvider'
import { describeImpact, impactLadder, type DonateProgramme } from '@/features/donations/api'
import { startDonationCheckout } from '@/features/donations/checkout'
import type { GiftFrequency } from '@/features/donations/donation-store'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

export function ImpactLadder({
  onDonated,
  campaignSlug,
}: {
  onDonated: (donationId: string) => void
  campaignSlug?: string
}) {
  const { locale, t } = useSite()
  const auth = useAuth()
  const g = t.give
  const accountEmail = auth.user?.email?.trim().toLowerCase() || ''
  const accountName =
    (auth.user?.user_metadata?.full_name as string | undefined)?.trim() || ''

  const [amount, setAmount] = useState(500)
  const [customDraft, setCustomDraft] = useState('')
  const [frequency, setFrequency] = useState<GiftFrequency>('once')
  const [programme, setProgramme] = useState<DonateProgramme>('where_needed')
  const [useAccountReceipt, setUseAccountReceipt] = useState(Boolean(accountEmail))
  const [receiptForOther, setReceiptForOther] = useState(false)
  const [receiptName, setReceiptName] = useState('')
  const [receiptEmail, setReceiptEmail] = useState('')
  const [journeyOptIn, setJourneyOptIn] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const presets = impactLadder().map((step) => step.amount)
  const programmes: DonateProgramme[] = [
    'sports',
    'fitness',
    'nutrition',
    'family',
    'where_needed',
  ]

  const showReceiptFields =
    !accountEmail || !useAccountReceipt || receiptForOther

  useEffect(() => {
    if (accountEmail) {
      setUseAccountReceipt(true)
      setReceiptForOther(false)
    }
  }, [accountEmail])

  function changeAmount(next: number) {
    const safe = Math.max(1, Math.round(next) || 1)
    setAmount(safe)
    setCustomDraft(String(safe))
    trackEvent('ladder_change', { amount: safe, frequency, programme })
  }

  function applyCustomDraft() {
    const parsed = Number(customDraft.replace(/,/g, ''))
    if (!Number.isFinite(parsed) || parsed < 1) return
    changeAmount(parsed)
  }

  const impactCopy =
    amount < 200 ? g.impactSmall : describeImpact(amount)[locale]

  const sliderValue = Math.min(5000, Math.max(100, amount))

  async function donate() {
    setError(null)

    const usingAccount = Boolean(accountEmail && useAccountReceipt && !receiptForOther)
    const email = usingAccount ? accountEmail : receiptEmail.trim().toLowerCase()
    const name = usingAccount
      ? accountName || receiptName.trim() || email.split('@')[0] || 'Donor'
      : receiptName.trim()

    if (!email || !name || (!usingAccount && (!receiptName.trim() || !receiptEmail.trim()))) {
      setError(g.receiptRequired)
      return
    }

    setBusy(true)
    try {
      trackEvent('donate_click', {
        amount,
        frequency,
        programme,
        journeyOptIn,
        receiptForOther: !usingAccount,
      })
      const result = await startDonationCheckout({
        amount_hkd: amount,
        frequency,
        programme,
        email,
        receipt_name: name,
        receipt_for_other: !usingAccount && (receiptForOther || Boolean(accountEmail)),
        journey_opt_in: journeyOptIn,
        campaign_slug: campaignSlug,
      })
      if (result.mode === 'stripe') {
        window.location.href = result.url
        return
      }
      onDonated(result.donation.id)
    } catch {
      setError('Could not start checkout. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const fieldClass =
    'mt-2 min-h-12 w-full rounded-md border border-navy/20 bg-white px-4 text-navy outline-none focus:border-navy'

  return (
    <div className="space-y-10">
      <section className="grid gap-8 rounded-3xl bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="font-display text-xl font-semibold text-navy">{g.everyDollarCounts}</p>

          <div className="mt-5 flex items-end justify-between gap-4">
            <label htmlFor="gift-amount" className="font-semibold text-navy">
              {g.amountLabel}
            </label>
            <output className="font-display text-3xl font-semibold text-red">
              HK${amount.toLocaleString()}
            </output>
          </div>
          <input
            id="gift-amount"
            type="range"
            min="100"
            max="5000"
            step="50"
            value={sliderValue}
            onChange={(event) => changeAmount(Number(event.target.value))}
            className="mt-5 min-h-11 w-full accent-red"
          />
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => changeAmount(preset)}
                className={cn(
                  'min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold',
                  amount === preset
                    ? 'border-navy bg-navy text-white'
                    : 'border-navy/20 text-navy hover:border-navy',
                )}
              >
                ${preset.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-navy/20 bg-paper p-4">
            <label htmlFor="custom-amount" className="text-sm font-semibold text-navy">
              {g.customAmountLabel}
            </label>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-navy/50">
                  HK$
                </span>
                <input
                  id="custom-amount"
                  inputMode="decimal"
                  min={1}
                  value={customDraft}
                  placeholder={String(amount)}
                  onChange={(event) => setCustomDraft(event.target.value)}
                  onBlur={applyCustomDraft}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      applyCustomDraft()
                    }
                  }}
                  className="min-h-12 w-full rounded-md border border-navy/20 bg-white py-3 pr-4 pl-12 text-navy outline-none focus:border-navy"
                />
              </div>
              <button
                type="button"
                onClick={applyCustomDraft}
                className="inline-flex min-h-12 shrink-0 items-center rounded-md border border-navy px-4 text-sm font-semibold text-navy"
              >
                {g.applyCustom}
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-navy/60">{g.customAmountHint}</p>
          </div>

          <fieldset className="mt-7">
            <legend className="sr-only">Donation frequency</legend>
            <div className="inline-flex flex-wrap rounded-full bg-paper p-1">
              {(['once', 'weekly', 'monthly'] as GiftFrequency[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFrequency(option)}
                  className={cn(
                    'min-h-11 rounded-full px-4 text-sm font-semibold sm:px-5',
                    frequency === option ? 'bg-teal text-white' : 'text-navy',
                  )}
                >
                  {option === 'once' ? g.once : option === 'weekly' ? g.weekly : g.monthly}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-7">
            <legend className="text-sm font-semibold text-navy">{g.programmeLabel}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {programmes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setProgramme(option)}
                  className={cn(
                    'min-h-11 rounded-full border px-4 text-sm font-semibold',
                    programme === option
                      ? 'border-teal bg-teal/10 text-teal'
                      : 'border-navy/15 text-navy',
                  )}
                >
                  {g.programmes[option]}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="flex flex-col rounded-2xl bg-yellow/25 p-5 sm:p-7">
          <p className="text-sm font-semibold tracking-[0.14em] text-red uppercase">
            {g.impactLabel}
          </p>
          <p className="mt-3 font-display text-2xl leading-snug font-semibold text-navy sm:text-3xl">
            {impactCopy}
          </p>

          <div className="mt-8 rounded-xl border border-navy/10 bg-white/80 p-4">
            <p className="text-sm font-semibold text-navy">{g.receiptTitle}</p>
            <p className="mt-1 text-xs leading-relaxed text-navy/60">{g.section88}</p>

            {accountEmail ? (
              <label className="mt-4 flex cursor-pointer gap-3">
                <input
                  type="checkbox"
                  checked={useAccountReceipt && !receiptForOther}
                  onChange={(e) => {
                    const on = e.target.checked
                    setUseAccountReceipt(on)
                    if (on) setReceiptForOther(false)
                  }}
                  className="mt-1 h-5 w-5 accent-teal"
                />
                <span>
                  <span className="block text-sm font-semibold text-navy">
                    {g.receiptUseAccount}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-navy/60">
                    {g.receiptUseAccountHint}{' '}
                    <span className="font-semibold text-navy/80">{accountEmail}</span>
                    {accountName ? ` · ${accountName}` : ''}
                  </span>
                </span>
              </label>
            ) : null}

            <label className="mt-4 flex cursor-pointer gap-3">
              <input
                type="checkbox"
                checked={receiptForOther}
                onChange={(e) => {
                  const on = e.target.checked
                  setReceiptForOther(on)
                  if (on) setUseAccountReceipt(false)
                }}
                className="mt-1 h-5 w-5 accent-teal"
              />
              <span>
                <span className="block text-sm font-semibold text-navy">
                  {g.receiptForOther}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-navy/60">
                  {g.receiptForOtherHint}
                </span>
              </span>
            </label>

            {showReceiptFields ? (
              <div className="mt-4 space-y-4 border-t border-navy/10 pt-4">
                <label className="block text-sm font-semibold text-navy">
                  {g.receiptNameLabel} *
                  <input
                    type="text"
                    autoComplete="name"
                    value={receiptName}
                    onChange={(e) => setReceiptName(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-semibold text-navy">
                  {g.receiptEmailLabel} *
                  <input
                    type="email"
                    autoComplete="email"
                    value={receiptEmail}
                    onChange={(e) => setReceiptEmail(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <p className="text-xs leading-relaxed text-navy/65">{g.receiptEmailHint}</p>
              </div>
            ) : null}
          </div>

          <label className="mt-5 flex cursor-pointer gap-3 rounded-xl border border-navy/10 bg-white/70 p-4">
            <input
              type="checkbox"
              checked={journeyOptIn}
              onChange={(e) => setJourneyOptIn(e.target.checked)}
              className="mt-1 h-5 w-5 accent-teal"
            />
            <span>
              <span className="block text-sm font-semibold text-navy">{g.journeyOptInLabel}</span>
              <span className="mt-1 block text-xs leading-relaxed text-navy/60">
                {g.journeyOptInHelper}
              </span>
            </span>
          </label>

          <p className="mt-6 text-sm leading-relaxed text-navy/65">{g.receiptNote}</p>
          <p className="mt-2 text-sm font-semibold text-teal">{g.trustStrip}</p>
          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-red">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void donate()}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-md bg-red px-6 font-semibold text-white hover:bg-red/90 disabled:opacity-60"
          >
            {busy ? g.donateWorking : `${g.donateCta} HK$${amount.toLocaleString()}`}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-navy/10 bg-amber/50 p-5 sm:p-8">
        <h2 className="font-display text-2xl font-semibold text-navy">{g.otherMeansTitle}</h2>
        <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-navy/80">
          <li>{g.otherMeansBank}</li>
          <li>{g.otherMeansCheque}</li>
          <li>{g.otherMeansAddress}</li>
        </ul>
      </section>
    </div>
  )
}

export type { GiftFrequency }
