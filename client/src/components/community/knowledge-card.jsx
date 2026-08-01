import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { cn } from '@/lib/utils'

const DOT_COUNT = 700
const LIT_INDEX = 349
// Real figure, matches stats.items 'activityTypes' in strings.ts (2024–25 annual report).
const ACTIVITY_TYPES_REAL = 84

function DotsVisual() {
  const { t } = useSite()
  // Constant-shape array (no reactive inputs) — React Compiler memoizes this.
  const dots = Array.from({ length: DOT_COUNT }, (_, i) => i)

  return (
    <div>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: 'repeat(28, minmax(0, 1fr))' }}
        role="img"
        aria-label={t.community.dotsCaption}
      >
        {dots.map((i) => (
          <span
            key={i}
            className={cn(
              'aspect-square rounded-full',
              i === LIT_INDEX ? 'bg-red shadow-[0_0_0_1px_rgba(201,80,58,0.35)]' : 'bg-navy/15',
            )}
          />
        ))}
      </div>
      <p className="mt-3 font-mono text-xs tracking-wide text-navy/55">
        {t.community.dotsCaption}
      </p>
    </div>
  )
}

function SliderVisual() {
  const { t } = useSite()
  const [guess, setGuess] = useState(20)
  const [revealed, setRevealed] = useState(false)

  return (
    <div>
      <label className="block">
        <span className="kicker text-teal">{t.community.sliderGuess}</span>
        <div className="mt-3 flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={100}
            value={guess}
            onChange={(e) => {
              setGuess(Number(e.target.value))
              setRevealed(false)
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-navy"
            aria-valuetext={`${guess} ${t.community.sliderUnit}`}
          />
          <span className="w-16 shrink-0 text-right font-display text-2xl font-bold text-navy">
            {guess}
          </span>
        </div>
      </label>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-navy px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          {t.community.sliderReveal}
        </button>
      ) : (
        <div className="mt-4 grid gap-3 rounded-xl bg-paper/80 p-4 sm:grid-cols-2">
          <div>
            <p className="kicker text-navy/50">{t.community.sliderYourGuess}</p>
            <p className="mt-1 font-display text-3xl font-bold text-navy">
              {guess} <span className="text-base font-medium text-navy/50">{t.community.sliderUnit}</span>
            </p>
          </div>
          <div>
            <p className="kicker text-teal">{t.community.sliderReal}</p>
            <p className="mt-1 font-display text-3xl font-bold text-teal">
              {ACTIVITY_TYPES_REAL}{' '}
              <span className="text-base font-medium text-teal/60">{t.community.sliderUnit}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export function KnowledgeCard({ item }) {
  const { locale, t } = useSite()

  return (
    <article className="break-inside-avoid overflow-hidden rounded-2xl border border-navy/15 bg-sage shadow-sm">
      <div className="p-5 sm:p-6">
        <p className="kicker text-teal">Know</p>
        <h3 className="mt-2 font-display text-xl leading-snug font-bold text-navy text-balance sm:text-2xl">
          {item.headline[locale]}
        </h3>
        <p className="mt-2 text-base leading-relaxed text-ink/85">
          {item.body[locale]}
        </p>
        <div className="mt-5">
          {item.kind === 'dots' ? <DotsVisual /> : <SliderVisual />}
        </div>
        <Link
          to="/volunteer"
          className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-red px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          {t.community.knowledgeHook}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
