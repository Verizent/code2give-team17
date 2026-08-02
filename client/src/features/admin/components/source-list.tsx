import { SOURCE_LABELS, label } from './labels'

export function SourceList({
  title,
  rows,
}: {
  title: string
  rows: Array<{ source: string; count: number }>
}) {
  const total = rows.reduce((sum, r) => sum + r.count, 0)

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-navy/45">{title}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.source} className="flex items-center gap-3">
            <span className="w-36 shrink-0 text-sm text-navy/75">
              {label(SOURCE_LABELS, row.source)}
            </span>
            <div
              className="h-2.5 rounded-sm bg-amber"
              style={{ width: `${Math.max(3, (row.count / Math.max(total, 1)) * 100)}%` }}
            />
            <span className="text-sm font-semibold text-navy/70">{row.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
