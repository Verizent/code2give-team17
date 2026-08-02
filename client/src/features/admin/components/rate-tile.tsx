/**
 * A rate tile. `null` renders as "not enough data" rather than 0% — the two mean very
 * different things and only one of them is a claim about the charity.
 */
export function RateTile({
  title,
  hint,
  value,
  detail,
  emptyLabel,
  unit = '%',
}: {
  title: string
  hint: string
  value: number | null
  detail: string
  emptyLabel: string
  /** Satisfaction is a score out of 5, not a percentage. */
  unit?: string
}) {
  const hasValue = value !== null

  return (
    <div className="rounded-lg border border-navy/10 bg-white/60 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-navy/45">{title}</p>
      {hasValue ? (
        <p className="mt-2 font-display text-3xl font-semibold text-navy">
          {value}
          <span className={unit === '%' ? '' : 'ml-1 text-lg font-normal text-navy/45'}>
            {unit}
          </span>
        </p>
      ) : (
        <p className="mt-2 font-display text-lg font-semibold text-navy/40">{emptyLabel}</p>
      )}
      <p className="mt-2 text-sm leading-relaxed text-navy/65">{hasValue ? detail : hint}</p>
    </div>
  )
}
