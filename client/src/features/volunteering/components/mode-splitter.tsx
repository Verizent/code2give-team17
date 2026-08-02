import { useSite } from '@/components/site-provider'
import { cn } from '@/lib/utils'

export type VolunteerMode = 'individual' | 'corporate'

export function ModeSplitter({
  value,
  onChange,
}: {
  value: VolunteerMode
  onChange: (mode: VolunteerMode) => void
}) {
  const { t } = useSite()
  const v = t.volunteer

  const modes = [
    {
      id: 'individual' as const,
      tag: v.individualTag,
      title: v.individualTitle,
      body: v.individualBody,
      cta: v.individualCta,
      accent: 'bg-yellow',
    },
    {
      id: 'corporate' as const,
      tag: v.corporateTag,
      title: v.corporateTitle,
      body: v.corporateBody,
      cta: v.corporateCta,
      accent: 'bg-teal text-white',
    },
  ]

  return (
    <section aria-labelledby="volunteer-mode-title">
      <h2
        id="volunteer-mode-title"
        className="font-display text-3xl font-semibold text-navy sm:text-4xl"
      >
        {v.modeTitle}
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {modes.map((mode) => {
          const selected = value === mode.id
          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(mode.id)}
              className={cn(
                'easy-choice-card min-h-44 rounded-2xl border p-6 text-left transition sm:p-8',
                selected
                  ? 'border-navy bg-paper shadow-[0_10px_30px_rgba(20,40,75,0.10)]'
                  : 'border-navy/25 bg-white hover:border-navy/50',
              )}
            >
              <span
                className={cn(
                  'inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase',
                  mode.accent,
                )}
              >
                {mode.tag}
              </span>
              <span className="mt-4 block font-display text-2xl font-semibold text-navy">
                {mode.title}
              </span>
              <span className="mt-2 block max-w-md text-[15px] leading-relaxed text-navy/70">
                {mode.body}
              </span>
              <span className="mt-5 block text-sm font-bold text-red">{mode.cta} →</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
