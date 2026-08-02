import type { AnalyticsPayload } from '@/features/admin/api'
import { PROGRAMME_LABELS, label } from './labels'

/** Grouped horizontal bars: places offered vs people who came. */
export function ProgrammeBars({
  rows,
  capacityLabel,
  attendedLabel,
}: {
  rows: AnalyticsPayload['programmes']
  capacityLabel: string
  attendedLabel: string
}) {
  const max = Math.max(...rows.map((r) => r.capacity), 1)

  return (
    <ul className="mt-5 flex flex-col gap-5">
      {rows.map((row) => (
        <li key={row.programme}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-navy">
              {label(PROGRAMME_LABELS, row.programme)}
            </span>
            <span className="text-sm text-navy/60">
              {row.attendance_count} / {row.capacity}
              {row.fill_rate !== null && (
                <span className="ml-2 font-semibold text-teal">{row.fill_rate}%</span>
              )}
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-[11px] text-navy/45">{capacityLabel}</span>
              <div
                className="h-3 rounded-sm bg-navy/15"
                style={{ width: `${Math.max(2, (row.capacity / max) * 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-[11px] text-navy/45">{attendedLabel}</span>
              <div
                className="h-3 rounded-sm bg-teal"
                style={{ width: `${Math.max(2, (row.attendance_count / max) * 100)}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
