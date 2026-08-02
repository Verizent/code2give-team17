import { useEffect, useState } from 'react'
import { useSite } from '@/components/site-provider'
import { useAuth } from '@/features/auth/AuthProvider'
import { describeImpact, impactLadder } from '@/features/donations/api'
import { startDonationCheckout } from '@/features/donations/checkout'
import type { GiftFrequency } from '@/features/donations/donation-store'
import { ApiError, apiClient } from '@/lib/apiClient'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

/**
 * Deliberately permissive: one `@`, a dot-bearing domain, no whitespace. Anything stricter
 * rejects addresses that are legitimately deliverable (new TLDs, `+` tags, quoted locals), and
 * a donate form is the worst place to argue with a donor about their own address. The
 * authority on deliverability is the receipt bouncing, not a regex.
 */
function isEmailish(value: string) {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value.trim())
}

/**
 * Upper bound on a single online gift, matching `recordDonationSchema` and the checkout
 * route's Zod cap server-side.
 *
 * Without it the form accepted any finite number and the ×100 conversion overflowed Stripe's
 * own maximum, so an over-large amount came back as a 500 carrying a raw Stripe message
 * rather than as something the donor could act on. A gift beyond this is a conversation with
 * the foundation, not a checkout session.
 */
const MAX_AMOUNT_HKD = 1_000_000

/**
 * Stripe's minimum charge in HKD, mirroring MIN_AMOUNT_HKD in checkout.service.js.
 *
 * The form used to accept anything from HK$1 and say so, but the checkout route rejects
 * below 4 — so HK$1–3 passed every control the donor could see and failed only after they
 * committed. The floor belongs where they type the number.
 */
const MIN_AMOUNT_HKD = 4

/**
 * "How did you hear about Love 21" — mirrors donors_referral_sources_check and
 * REFERRAL_SOURCES in donors.service.js. Keep all three in step.
 *
 * Separate vocabulary from the volunteer form's profiles.discovery on purpose: donors and
 * volunteers arrive by different routes, and one shared list would be wrong for both.
 */
const REFERRAL_SOURCES = [
  'friend_family',
  'social',
  'edm',
  'company',
  'event',
  'press',
  'search',
  'other',
] as const

type ReferralSource = (typeof REFERRAL_SOURCES)[number]

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
  const [useAccountReceipt, setUseAccountReceipt] = useState(Boolean(accountEmail))
  const [receiptForOther, setReceiptForOther] = useState(false)
  const [receiptName, setReceiptName] = useState('')
  const [receiptEmail, setReceiptEmail] = useState('')
  const [journeyOptIn, setJourneyOptIn] = useState(true)
  const [referralSources, setReferralSources] = useState<ReferralSource[]>([])
  const [referralOther, setReferralOther] = useState('')
  // Asked once per donor. `true` hides the block for someone who has already told us;
  // it stays false for a first-time donor and for anyone we cannot resolve, so the default
  // is to ask rather than to silently skip.
  const [referralAnswered, setReferralAnswered] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Separate from `error`, which renders beside the Donate button in the other column. An
  // amount the form refused has to be reported where the donor typed it.
  const [amountError, setAmountError] = useState<string | null>(null)

  const presets = impactLadder().map((step) => step.amount)

  const showReceiptFields =
    !accountEmail || !useAccountReceipt || receiptForOther

  useEffect(() => {
    if (accountEmail) {
      setUseAccountReceipt(true)
      setReceiptForOther(false)
    }
  }, [accountEmail])

  // Whichever address the receipt is going to is the one we look up — for a signed-in donor
  // giving under their own name that is the account email, never the typed field.
  const lookupEmail = (
    accountEmail && useAccountReceipt && !receiptForOther ? accountEmail : receiptEmail
  )
    .trim()
    .toLowerCase()

  // Has this donor already told us how they found Love 21? Debounced because it runs off a
  // field being typed into, and deliberately fail-open: a lookup that errors leaves the
  // question showing, so the worst case is asking someone twice rather than losing the
  // answer of a first-time donor.
  useEffect(() => {
    if (!isEmailish(lookupEmail)) {
      setReferralAnswered(false)
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const response = (await apiClient(
            `/api/donations/referral-status?email=${encodeURIComponent(lookupEmail)}`,
          )) as { data?: { answered?: boolean } }
          if (!cancelled) setReferralAnswered(Boolean(response.data?.answered))
        } catch {
          if (!cancelled) setReferralAnswered(false)
        }
      })()
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [lookupEmail])

  function changeAmount(next: number) {
    const safe = Math.min(
      MAX_AMOUNT_HKD,
      Math.max(MIN_AMOUNT_HKD, Math.round(next) || MIN_AMOUNT_HKD),
    )
    setAmountError(null)
    setAmount(safe)
    setCustomDraft(String(safe))
    trackEvent('ladder_change', { amount: safe, frequency })
  }

  function applyCustomDraft() {
    const parsed = Number(customDraft.replace(/,/g, ''))
    // Every rejection below has to say so. These used to `return` silently, which left the
    // rejected text sitting in the field with the gift unchanged — indistinguishable from a
    // dead Apply button.
    if (!Number.isFinite(parsed) || parsed < MIN_AMOUNT_HKD) {
      setAmountError(g.amountInvalid)
      return
    }
    if (parsed > MAX_AMOUNT_HKD) {
      setAmountError(g.amountTooLarge)
      return
    }
    setAmountError(null)
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

    // `type="email"` on the input does nothing here: native constraint validation only runs on
    // form submit, and this component has no <form> — the button is type="button" with an
    // onClick. So the field accepted any non-empty string, and "asdf" reached the Section 88
    // receipt address unchallenged.
    if (!isEmailish(email)) {
      setError(g.receiptEmailInvalid)
      return
    }

    setBusy(true)
    try {
      trackEvent('donate_click', {
        amount,
        frequency,
        journeyOptIn,
        receiptForOther: !usingAccount,
        referralSources,
      })
      const result = await startDonationCheckout({
        amount_hkd: amount,
        frequency,
        email,
        receipt_name: name,
        receipt_for_other: !usingAccount && (receiptForOther || Boolean(accountEmail)),
        journey_opt_in: journeyOptIn,
        campaign_slug: campaignSlug,
        // Omitted entirely once the donor has answered before — the server would ignore it
        // anyway, but there is no reason to send an answer that cannot be recorded.
        ...(referralAnswered
          ? {}
          : {
              referral_sources: referralSources,
              referral_source_other: referralSources.includes('other')
                ? referralOther.trim() || undefined
                : undefined,
            }),
      })
      if (result.mode === 'stripe') {
        window.location.href = result.url
        return
      }
      onDonated(result.donation.id)
    } catch (err) {
      // Show what the server actually said. `startDonationCheckout` no longer falls back to a
      // local gift, so this is the only place a checkout failure becomes visible at all.
      const detail = err instanceof ApiError ? err.message : ''
      setError(detail || 'Could not start checkout. Please try again.')
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
                  min={MIN_AMOUNT_HKD}
                  max={MAX_AMOUNT_HKD}
                  aria-invalid={amountError ? true : undefined}
                  aria-describedby={amountError ? 'custom-amount-error' : undefined}
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
            {amountError && (
              <p
                id="custom-amount-error"
                role="alert"
                className="mt-2 text-xs leading-relaxed font-medium text-red"
              >
                {amountError}
              </p>
            )}
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

          {/* Analytics only, and asked once per donor — hidden entirely for anyone who has
              already answered rather than shown pre-filled, because there is nothing here
              for them to change. Optional throughout: no validation, no bearing on whether
              the gift can be given. */}
          {!referralAnswered && (
            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-navy">{g.referralLabel}</legend>
              <p className="mt-1 text-xs leading-relaxed text-navy/60">{g.referralHelper}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {REFERRAL_SOURCES.map((option) => {
                  const selected = referralSources.includes(option)
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setReferralSources((current) =>
                          current.includes(option)
                            ? current.filter((entry) => entry !== option)
                            : [...current, option],
                        )
                      }
                      className={cn(
                        'min-h-11 rounded-full border px-4 text-sm font-semibold',
                        selected
                          ? 'border-teal bg-teal/10 text-teal'
                          : 'border-navy/15 text-navy',
                      )}
                    >
                      {g.referralSources[option]}
                    </button>
                  )
                })}
              </div>
              {referralSources.includes('other') && (
                <input
                  type="text"
                  maxLength={200}
                  value={referralOther}
                  onChange={(event) => setReferralOther(event.target.value)}
                  placeholder={g.referralOtherPlaceholder}
                  aria-label={g.referralOtherPlaceholder}
                  className="mt-3 min-h-12 w-full rounded-md border border-navy/20 bg-white px-4 text-navy outline-none focus:border-navy"
                />
              )}
            </fieldset>
          )}

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
