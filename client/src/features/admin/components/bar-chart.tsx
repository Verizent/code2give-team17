function formatMonth(month: string) {
  const [y, m] = month.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[Number(m) - 1] ?? m} ${y?.slice(2) ?? ''}`
}

/** Hand-rolled CSS bars. No chart library — that would be a shared dependency. */
export function BarChart({
  label,
  description,
  unitLabel,
  emptyLabel,
  totalSuffix,
  values,
  valueKey,
  formatValue,
}: {
  label: string
  description: string
  unitLabel: string
  emptyLabel: string
  totalSuffix: string
  values: Array<Record<string, string | number>>
  valueKey: string
  formatValue: (n: number) => string
}) {
  const nums = values.map((row) => Number(row[valueKey]) || 0)
  const max = Math.max(...nums, 1)
  const total = nums.reduce((sum, n) => sum + n, 0)

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-navy">{label}</h3>
        <p className="text-sm font-semibold text-teal">
          {formatValue(total)}
          <span className="ml-1 font-normal text-navy/50">· {totalSuffix}</span>
        </p>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-navy/65">{description}</p>
      {total === 0 ? (
        <p className="mt-6 text-sm text-navy/55">{emptyLabel}</p>
      ) : (
        <>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-navy/45">{unitLabel}</p>
          <ul className="mt-3 flex items-end gap-2" aria-label={label}>
            {values.map((row) => {
              const n = Number(row[valueKey]) || 0
              return (
                <li
                  key={String(row.month)}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                >
                  <span className="max-w-full truncate text-[10px] font-semibold tabular-nums text-navy/70">
                    {formatValue(n)}
                  </span>
                  <div
                    className="w-full max-w-10 rounded-t-md bg-teal/85"
                    style={{ height: Math.max(8, Math.round((n / max) * 120)) }}
                    title={`${formatMonth(String(row.month))}: ${formatValue(n)}`}
                  />
                  <span className="text-[11px] font-medium text-navy/55">
                    {formatMonth(String(row.month))}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
