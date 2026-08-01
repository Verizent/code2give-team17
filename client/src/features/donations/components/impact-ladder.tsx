import { useState } from 'react'
import { useSite } from '@/components/site-provider'
import { describeImpact, impactLadder, type DonateProgramme } from '@/features/donations/api'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

type Frequency = 'once' | 'weekly' | 'monthly'

export function ImpactLadder({
  onDonate,
  donating = false,
}: {
  onDonate: (gift: {
    amount: number
    email: string
    frequency: Frequency
    programme: DonateProgramme
  }) => void | Promise<void>
  donating?: boolean
}) {
  const { locale, t } = useSite()
  const g = t.give
  const [amount, setAmount] = useState(500)
  const [customDraft, setCustomDraft] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('once')
  const [programme, setProgramme] = useState<DonateProgramme>('where_needed')
  const [email, setEmail] = useState('')
  const presets = impactLadder().map((step) => step.amount)
  const programmes: DonateProgramme[] = [
    'sports',
    'fitness',
    'nutrition',
    'family',
    'where_needed',
  ]

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
                OK
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-navy/60">{g.customAmountHint}</p>
          </div>

          <fieldset className="mt-7">
            <legend className="sr-only">Donation frequency</legend>
            <div className="inline-flex flex-wrap rounded-full bg-paper p-1">
              {(['once', 'weekly', 'monthly'] as Frequency[]).map((option) => (
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
          <div className="mt-8">
            <label htmlFor="donor-email" className="text-sm font-semibold text-navy">
              {g.emailLabel}
            </label>
            <input
              id="donor-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-md border border-navy/20 bg-white px-4 text-navy outline-none focus:border-navy"
            />
            <p className="mt-2 text-xs leading-relaxed text-navy/65">{g.emailHint}</p>
          </div>
          <p className="mt-6 text-sm text-navy/70">{g.section88}</p>
          <p className="mt-2 text-sm leading-relaxed text-navy/65">{g.receiptNote}</p>
          <p className="mt-2 text-sm font-semibold text-teal">{g.trustStrip}</p>
          <button
            type="button"
            disabled={donating || !email.trim()}
            onClick={() => onDonate({ amount, email, frequency, programme })}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-md bg-red px-6 font-semibold text-white hover:bg-red/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {donating ? '…' : `${g.donateCta} HK$${amount.toLocaleString()}`}
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
