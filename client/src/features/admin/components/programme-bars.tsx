import type { AnalyticsPayload } from '@/features/admin/api'
import { PROGRAMME_LABELS, label } from './labels'

/**
 * Three measures per programme: places offered, signed up, turned up.
 *
 * Signed-up and attended share one track, attended nested inside signed-up, so the
 * exposed tail IS the no-show gap. Three stacked full-width rows would have shown the
 * same numbers while hiding the relationship between them.
 */
export function ProgrammeBars({
  rows,
  capacityLabel,
  signedUpLabel,
  attendedLabel,
  emptyLabel,
}: {
  rows: AnalyticsPayload['programmes']
  capacityLabel: string
  signedUpLabel: string
  attendedLabel: string
  emptyLabel: string
}) {
  if (rows.length === 0) {
    return <p className="mt-6 text-sm text-navy/55">{emptyLabel}</p>
  }

  const max = Math.max(...rows.map((r) => r.capacity), 1)
  const width = (n: number) => `${Math.max(1, (n / max) * 100)}%`

  return (
    <ul className="mt-5 flex flex-col gap-6">
      {rows.map((row) => (
        <li key={row.programme}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-navy">
              {label(PROGRAMME_LABELS, row.programme)}
            </span>
            <span className="text-sm text-navy/60">
              {row.attended} {attendedLabel.toLowerCase()} · {row.signups} / {row.capacity}
              {row.fill_rate !== null && (
                <span className="ml-2 font-semibold text-teal">{row.fill_rate}%</span>
              )}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="w-28 shrink-0 text-[11px] text-navy/45">{capacityLabel}</span>
            <div className="h-3 rounded-sm bg-navy/15" style={{ width: width(row.capacity) }} />
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span className="w-28 shrink-0 text-[11px] text-navy/45">{signedUpLabel}</span>
            <div
              className="relative h-3 rounded-sm bg-navy"
              style={{ width: width(row.signups) }}
              title={`${row.signups} ${signedUpLabel}`}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-sm bg-teal"
                style={{
                  width: `${row.signups > 0 ? (row.attended / row.signups) * 100 : 0}%`,
                }}
                title={`${row.attended} ${attendedLabel}`}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
