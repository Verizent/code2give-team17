import type { Localized } from '@/lib/mock'

export type DonateProgramme =
  | 'sports'
  | 'fitness'
  | 'nutrition'
  | 'family'
  | 'where_needed'

export type WishlistItem = {
  id: string
  title: Localized
  why: Localized
  needed: number
  pledged: number
  image: string
  accent: string
}

export type ImpactStep = {
  amount: number
  label: Localized
}

/** DEMO-ONLY impact ladder — amounts → plain outcomes. */
export const IMPACT_LADDER: ImpactStep[] = [
  {
    amount: 200,
    label: {
      en: 'One sports session for a small group',
      'zh-Hant': '一節小組運動課',
      'zh-Hans': '一节小组运动课',
    },
  },
  {
    amount: 500,
    label: {
      en: 'A week of nutrition class materials',
      'zh-Hant': '一星期營養課物料',
      'zh-Hans': '一星期营养课物料',
    },
  },
  {
    amount: 1000,
    label: {
      en: 'A month of fitness sessions for one group',
      'zh-Hant': '一個小組一個月體能課',
      'zh-Hans': '一个小组一个月体能课',
    },
  },
  {
    amount: 2500,
    label: {
      en: 'A family programme block for a term',
      'zh-Hant': '一個學期的家庭計劃',
      'zh-Hans': '一个学期的家庭计划',
    },
  },
  {
    amount: 5000,
    label: {
      en: 'Keeps several weekly classes free for a month',
      'zh-Hant': '維持多個每週課堂免費一個月',
      'zh-Hans': '维持多个每周课堂免费一个月',
    },
  },
]

export function impactForAmount(amount: number): Localized {
  if (amount < IMPACT_LADDER[0].amount) {
    return {
      en: 'Every dollar helps keep programmes free for members.',
      'zh-Hant': '每一元都幫助會員計劃保持免費。',
      'zh-Hans': '每一元都帮助会员计划保持免费。',
    }
  }
  let best = IMPACT_LADDER[0]
  for (const step of IMPACT_LADDER) {
    if (amount >= step.amount) best = step
  }
  return best.label
}

/** DEMO-ONLY wishlist. */
export const wishlistItems: WishlistItem[] = [
  {
    id: 'trampoline-socks',
    title: {
      en: 'Trampoline grip socks',
      'zh-Hant': '彈床防滑襪',
      'zh-Hans': '弹床防滑袜',
    },
    why: {
      en: 'Safer jumps and fewer slips in every trampoline session.',
      'zh-Hant': '讓每節彈床課更安全、減少滑倒。',
      'zh-Hans': '让每节弹床课更安全、减少滑倒。',
    },
    needed: 40,
    pledged: 12,
    image: '/brand/hero-climb.jpg',
    accent: '#00857d',
  },
  {
    id: 'art-supplies',
    title: {
      en: 'Art class supplies pack',
      'zh-Hant': '藝術課物料包',
      'zh-Hans': '艺术课物料包',
    },
    why: {
      en: 'Paints, paper, and brushes so every member can finish a piece.',
      'zh-Hant': '顏料、紙張與畫筆，讓每位學員都能完成作品。',
      'zh-Hans': '颜料、纸张与画笔，让每位学员都能完成作品。',
    },
    needed: 20,
    pledged: 8,
    image: '/brand/activity.jpg',
    accent: '#F5A3B6',
  },
  {
    id: 'kitchen-tools',
    title: {
      en: 'Teaching kitchen tools',
      'zh-Hant': '教學廚房用具',
      'zh-Hans': '教学厨房用具',
    },
    why: {
      en: 'Safe knives, boards, and measuring cups for cook & share.',
      'zh-Hant': '安全刀具、砧板與量杯，供烹飪共享課使用。',
      'zh-Hans': '安全刀具、砧板与量杯，供烹饪共享课使用。',
    },
    needed: 15,
    pledged: 15,
    image: '/brand/member.jpg',
    accent: '#FFC72C',
  },
  {
    id: 'sports-cones',
    title: {
      en: 'Sports cones & markers',
      'zh-Hant': '運動錐筒與標記',
      'zh-Hans': '运动锥筒与标记',
    },
    why: {
      en: 'Set up drills and games outdoors without borrowing gear.',
      'zh-Hant': '戶外訓練與遊戲可自行佈場，無需借用器材。',
      'zh-Hans': '户外训练与游戏可自行布场，无需借用器材。',
    },
    needed: 30,
    pledged: 6,
    image: '/brand/hero-group.jpg',
    accent: '#14284B',
  },
]

export function getWishlistItem(id: string) {
  return wishlistItems.find((i) => i.id === id)
}

/** DEMO-ONLY: emails that already have an account. */
export const DEMO_EXISTING_ACCOUNT_EMAILS = new Set([
  'member@love21.demo',
  'volunteer@love21.demo',
])

export function demoAccountExists(email: string) {
  return DEMO_EXISTING_ACCOUNT_EMAILS.has(email.trim().toLowerCase())
}

export const COVER_IMAGE_OPTIONS = [
  '/brand/hero-group.jpg',
  '/brand/hero-climb.jpg',
  '/brand/class.jpg',
  '/brand/activity.jpg',
  '/brand/member.jpg',
]
