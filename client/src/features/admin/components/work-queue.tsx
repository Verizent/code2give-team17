import { Link } from 'react-router-dom'
import type { DashboardQueueItem } from '@/features/admin/api'

/**
 * What needs attention today. Sits at the top of the hub because it is the only block
 * on the page that is actionable — everything below it is reporting.
 */
export function WorkQueue({
  items,
  openLabel,
  emptyLabel,
}: {
  items: DashboardQueueItem[]
  openLabel: string
  emptyLabel: string
}) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-navy/55">{emptyLabel}</p>
  }

  return (
    <ul className="mt-4 divide-y divide-navy/10 border-y border-navy/10">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-navy">
              {item.title}
              {item.count != null ? <span className="ml-2 text-teal">({item.count})</span> : null}
            </p>
            <p className="text-sm text-navy/65">{item.detail}</p>
          </div>
          <Link
            to={item.href}
            className="inline-flex min-h-11 shrink-0 items-center font-semibold text-teal underline-offset-4 hover:underline"
          >
            {openLabel}
          </Link>
        </li>
      ))}
    </ul>
  )
}
