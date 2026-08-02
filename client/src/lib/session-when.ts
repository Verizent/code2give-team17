import type { Localized } from '@/lib/mock'

const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const EN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const
const ZH_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const

const HKT = 'Asia/Hong_Kong'

/** Next occurrence of weekday (0=Sun…6=Sat), at least `minDaysAhead` from today. */
export function nextWeekday(weekday: number, minDaysAhead = 1): Date {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  let delta = (weekday - d.getDay() + 7) % 7
  if (delta < minDaysAhead) delta += 7
  d.setDate(d.getDate() + delta)
  return d
}

export function formatSessionWhen(
  date: Date,
  start: string,
  end?: string,
): Localized {
  const wd = date.getDay()
  const day = date.getDate()
  const month = date.getMonth()
  const time = end ? `${start}–${end}` : start

  return {
    en: `${EN_WEEKDAYS[wd]} ${day} ${EN_MONTHS[month]} · ${time}`,
    'zh-Hant': `${month + 1}月${day}日（${ZH_WEEKDAYS[wd]}）· ${time}`,
    'zh-Hans': `${month + 1}月${day}日（${ZH_WEEKDAYS[wd]}）· ${time}`,
  }
}

function partsInHkt(iso: string) {
  const d = new Date(iso)
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: HKT,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const bag = Object.fromEntries(
    fmt
      .formatToParts(d)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  )
  const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    bag.weekday?.slice(0, 3) ?? 'Sun',
  )
  const monthIndex = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ].indexOf(bag.month ?? 'Jan')

  return {
    weekdayIndex: weekdayIndex >= 0 ? weekdayIndex : 0,
    day: Number(bag.day) || 1,
    monthIndex: monthIndex >= 0 ? monthIndex : 0,
    time: `${bag.hour ?? '00'}:${bag.minute ?? '00'}`,
  }
}

/** Format Supabase `starts_at` / `ends_at` (timestamptz) for display in HKT. */
export function formatSessionWhenFromIso(
  startsAt: string,
  endsAt?: string | null,
): Localized {
  const start = partsInHkt(startsAt)
  const end = endsAt ? partsInHkt(endsAt).time : undefined
  const time = end ? `${start.time}–${end}` : start.time
  const wd = start.weekdayIndex
  const day = start.day
  const month = start.monthIndex

  return {
    en: `${EN_WEEKDAYS[wd]} ${day} ${EN_MONTHS[month]} · ${time}`,
    'zh-Hant': `${month + 1}月${day}日（${ZH_WEEKDAYS[wd]}）· ${time}`,
    'zh-Hans': `${month + 1}月${day}日（${ZH_WEEKDAYS[wd]}）· ${time}`,
  }
}
