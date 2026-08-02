import { ANALYTICS_RANGES, type AnalyticsRange } from './labels'

/**
 * One control for the whole illustrative section.
 *
 * Not one per metric: six controls on a screen a judge reads in a minute is noise, and
 * these metrics are meant to be read against each other over the same window.
 */
export function RangeFilter({
  value,
  onChange,
  labels,
  legend,
  busy,
}: {
  value: AnalyticsRange
  onChange: (range: AnalyticsRange) => void
  labels: Record<AnalyticsRange, string>
  legend: string
  busy: boolean
}) {
  return (
    <div
      role="group"
      aria-label={legend}
      aria-busy={busy}
      className="inline-flex flex-wrap gap-1 rounded-md border border-navy/15 bg-white/70 p-1"
    >
      {ANALYTICS_RANGES.map((range) => {
        const active = range === value
        return (
          <button
            key={range}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(range)}
            className={[
              'min-h-9 rounded px-3 text-sm font-semibold transition-colors',
              active ? 'bg-navy text-white' : 'text-navy/70 hover:bg-navy/5 hover:text-navy',
            ].join(' ')}
          >
            {labels[range]}
          </button>
        )
      })}
    </div>
  )
}
