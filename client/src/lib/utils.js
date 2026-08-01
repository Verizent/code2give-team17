import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const DAY_MS = 86400000

/**
 * Relative time label from an ISO date, e.g. "Today" / "3 days ago" / "2 weeks ago".
 * `labels` is a locale's community strings (timeToday, timeDayAgo, timeDaysAgo, …);
 * singular/plural templates take a `{n}` placeholder.
 */
export function formatRelativeTime(isoDate, labels) {
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / DAY_MS)
  if (days <= 0) return labels.timeToday
  if (days < 7) return labels[days === 1 ? 'timeDayAgo' : 'timeDaysAgo'].replace('{n}', days)

  const weeks = Math.floor(days / 7)
  if (weeks < 5) return labels[weeks === 1 ? 'timeWeekAgo' : 'timeWeeksAgo'].replace('{n}', weeks)

  const months = Math.floor(days / 30)
  return labels[months === 1 ? 'timeMonthAgo' : 'timeMonthsAgo'].replace('{n}', months)
}
