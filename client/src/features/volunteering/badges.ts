import type { Localized } from '@/lib/mock'

/**
 * Recognition badges — framed as hours / sessions logged (CONTEXT §17),
 * not a collectible game. Evaluation uses Love 21 signups only; HandsOn
 * hours are never claimed here.
 */
export type BadgeDefinition = {
  code: string
  name: Localized
  description: Localized
  criteria_type: 'signup_count' | 'hours' | 'programme_variety'
  threshold: number
}

export type EarnedBadge = BadgeDefinition & {
  earned: boolean
  progress: number
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    code: 'first_session',
    name: {
      en: 'First session',
      'zh-Hant': '第一次課堂',
      'zh-Hans': '第一次课堂',
    },
    description: {
      en: 'Signed up for your first Love 21 session.',
      'zh-Hant': '報名了第一節 Love 21 課堂。',
      'zh-Hans': '报名了第一节 Love 21 课堂。',
    },
    criteria_type: 'signup_count',
    threshold: 1,
  },
  {
    code: 'three_sessions',
    name: {
      en: 'Three sessions',
      'zh-Hant': '三節課堂',
      'zh-Hans': '三节课堂',
    },
    description: {
      en: 'Three confirmed Love 21 session signups.',
      'zh-Hant': '已確認報名三節 Love 21 課堂。',
      'zh-Hans': '已确认报名三节 Love 21 课堂。',
    },
    criteria_type: 'signup_count',
    threshold: 3,
  },
  {
    code: 'five_hours',
    name: {
      en: 'Five hours',
      'zh-Hant': '五小時',
      'zh-Hans': '五小时',
    },
    description: {
      en: 'About five hours across Love 21 sessions you’ve signed up for.',
      'zh-Hant': 'Love 21 課堂報名累計約五小時。',
      'zh-Hans': 'Love 21 课堂报名累计约五小时。',
    },
    criteria_type: 'hours',
    threshold: 5,
  },
  {
    code: 'two_programmes',
    name: {
      en: 'Two programmes',
      'zh-Hant': '兩類計劃',
      'zh-Hans': '两类计划',
    },
    description: {
      en: 'Shown up across two different programme areas.',
      'zh-Hant': '參與過兩類不同計劃。',
      'zh-Hans': '参与过两类不同计划。',
    },
    criteria_type: 'programme_variety',
    threshold: 2,
  },
]

export function evaluateBadges(stats: {
  signup_count: number
  hours: number
  programme_count: number
}): EarnedBadge[] {
  return BADGE_DEFINITIONS.map((badge) => {
    const progress =
      badge.criteria_type === 'signup_count'
        ? stats.signup_count
        : badge.criteria_type === 'hours'
          ? stats.hours
          : stats.programme_count
    return {
      ...badge,
      progress,
      earned: progress >= badge.threshold,
    }
  })
}
