import type { Localized } from '@/lib/mock'

export type VolunteerSkill =
  | 'patient'
  | 'sports'
  | 'music'
  | 'kitchen'
  | 'photography'
  | 'youth14'
  | 'cantonese'

export type OpportunitySource = 'handson' | 'internal'

export type VolunteerOpportunity = {
  id: string
  title: Localized
  programme: Localized
  when: Localized
  place: Localized
  /** HandsOn-style: hide venue until after signup */
  placeHiddenUntilSignup: boolean
  source: OpportunitySource
  capacity: number
  spots_filled: number
  interested_count: number
  skills: VolunteerSkill[]
  recruiting: boolean
  external_url?: string
  description: Localized
  age_note: Localized
  whatYouDo: Localized
  group_note: Localized
  youth14: boolean
  image: string
}

export const VOLUNTEER_SKILLS: VolunteerSkill[] = [
  'patient',
  'sports',
  'music',
  'kitchen',
  'photography',
  'youth14',
  'cantonese',
]

/** DEMO-ONLY fixtures seeded from HandsOn research + internal programmes. */
export const opportunities: VolunteerOpportunity[] = [
  {
    id: 'kpop-dance',
    title: {
      en: 'K-pop Dance Class Assistant',
      'zh-Hant': 'K-pop 舞蹈班助理',
      'zh-Hans': 'K-pop 舞蹈班助理',
    },
    programme: {
      en: 'Art / Music / Dance',
      'zh-Hant': '藝術／音樂／舞蹈',
      'zh-Hans': '艺术／音乐／舞蹈',
    },
    when: {
      en: 'Sat 9 Aug · 10:00–11:30',
      'zh-Hant': '8月9日（六）· 10:00–11:30',
      'zh-Hans': '8月9日（六）· 10:00–11:30',
    },
    place: {
      en: 'Address after signup',
      'zh-Hant': '報名後提供地址',
      'zh-Hans': '报名后提供地址',
    },
    placeHiddenUntilSignup: true,
    source: 'handson',
    capacity: 1,
    spots_filled: 0,
    interested_count: 3,
    skills: ['patient', 'music', 'youth14'],
    recruiting: true,
    external_url:
      'https://volunteer.handsonhongkong.org/opportunity/a0CQ90000DFXgKwMQL',
    description: {
      en: 'Join the class as an active participant — warm up, dance along, and support members through the routine.',
      'zh-Hant': '以參與者身份加入課堂——一起熱身、跳舞，並在動作中支援學員。',
      'zh-Hans': '以参与者身份加入课堂——一起热身、跳舞，并在动作中支援学员。',
    },
    age_note: {
      en: '16+ (Youth 14+ welcome with guardian). Cantonese preferred, not required.',
      'zh-Hant': '16 歲或以上（14+ 青少年須有監護人）。粵語較佳，非必須。',
      'zh-Hans': '16 岁或以上（14+ 青少年须有监护人）。粤语较佳，非必须。',
    },
    whatYouDo: {
      en: 'Dance with the group, model moves, encourage members, and help keep the energy high — not sit on the sidelines.',
      'zh-Hant': '與學員一起跳舞、示範動作、鼓勵大家，維持課堂氣氛——不是旁觀。',
      'zh-Hans': '与学员一起跳舞、示范动作、鼓励大家，维持课堂气氛——不是旁观。',
    },
    group_note: {
      en: 'Group of 8–12 · ages roughly 6–45',
      'zh-Hant': '每組約 8–12 人 · 年齡約 6–45 歲',
      'zh-Hans': '每组约 8–12 人 · 年龄约 6–45 岁',
    },
    youth14: true,
    image: '/brand/class.jpg',
  },
  {
    id: 'mix-media-art',
    title: {
      en: 'Mix Media Art Class Assistant',
      'zh-Hant': '混合媒介藝術班助理',
      'zh-Hans': '混合媒介艺术班助理',
    },
    programme: {
      en: 'Art / Music / Dance',
      'zh-Hant': '藝術／音樂／舞蹈',
      'zh-Hans': '艺术／音乐／舞蹈',
    },
    when: {
      en: 'Sun 17 Aug · 14:00–15:30',
      'zh-Hant': '8月17日（日）· 14:00–15:30',
      'zh-Hans': '8月17日（日）· 14:00–15:30',
    },
    place: {
      en: 'Address after signup',
      'zh-Hant': '報名後提供地址',
      'zh-Hans': '报名后提供地址',
    },
    placeHiddenUntilSignup: true,
    source: 'handson',
    capacity: 1,
    spots_filled: 1,
    interested_count: 5,
    skills: ['patient', 'photography'],
    recruiting: true,
    external_url:
      'https://volunteer.handsonhongkong.org/opportunity/a0CQ90000FjeH0wMQE',
    description: {
      en: 'Help set up materials, create alongside members, and cheer on finished pieces.',
      'zh-Hant': '協助準備物料、與學員一起創作，並為完成作品打氣。',
      'zh-Hans': '协助准备物料、与学员一起创作，并为完成作品加油。',
    },
    age_note: {
      en: '16+. Cantonese preferred, not required.',
      'zh-Hant': '16 歲或以上。粵語較佳，非必須。',
      'zh-Hans': '16 岁或以上。粤语较佳，非必须。',
    },
    whatYouDo: {
      en: 'Lay out paints and paper, sit at the table with members, and celebrate each finished piece.',
      'zh-Hant': '擺放顏料與紙張，與學員同桌創作，為每幅作品喝采。',
      'zh-Hans': '摆放颜料与纸张，与学员同桌创作，为每幅作品喝彩。',
    },
    group_note: {
      en: 'Group of 8–12 · ages roughly 6–45',
      'zh-Hant': '每組約 8–12 人 · 年齡約 6–45 歲',
      'zh-Hans': '每组约 8–12 人 · 年龄约 6–45 岁',
    },
    youth14: false,
    image: '/brand/activity.jpg',
  },
  {
    id: 'trampoline-assist',
    title: {
      en: 'Trampoline session assist',
      'zh-Hant': '彈床課助理',
      'zh-Hans': '弹床课助理',
    },
    programme: {
      en: 'Sports & Fitness',
      'zh-Hant': '運動與體能',
      'zh-Hans': '运动与体能',
    },
    when: {
      en: 'Wed 13 Aug · 16:00–17:00',
      'zh-Hant': '8月13日（三）· 16:00–17:00',
      'zh-Hans': '8月13日（三）· 16:00–17:00',
    },
    place: {
      en: 'Wan Chai sports hall',
      'zh-Hant': '灣仔體育館',
      'zh-Hans': '湾仔体育馆',
    },
    placeHiddenUntilSignup: false,
    source: 'internal',
    capacity: 2,
    spots_filled: 0,
    interested_count: 1,
    skills: ['sports', 'patient', 'youth14'],
    recruiting: true,
    description: {
      en: 'Spot safely, bounce with the group, and help members take turns on the trampoline.',
      'zh-Hant': '安全守護、與學員一起彈跳，協助輪流使用彈床。',
      'zh-Hans': '安全守护、与学员一起弹跳，协助轮流使用弹床。',
    },
    age_note: {
      en: '16+ (Youth 14+ welcome). Comfortable with active movement.',
      'zh-Hant': '16 歲或以上（歡迎 14+ 青少年）。需能應付活躍動作。',
      'zh-Hans': '16 岁或以上（欢迎 14+ 青少年）。需能应付活跃动作。',
    },
    whatYouDo: {
      en: 'Stand close for safe spotting, cheer turns, and join warm-ups — you are part of the session.',
      'zh-Hant': '近距離守護安全、為輪次打氣，並一起熱身——你是課堂的一員。',
      'zh-Hans': '近距离守护安全、为轮次加油，并一起热身——你是课堂的一员。',
    },
    group_note: {
      en: 'Small group · coaches on site',
      'zh-Hant': '小組 · 教練在場',
      'zh-Hans': '小组 · 教练在场',
    },
    youth14: true,
    image: '/brand/hero-climb.jpg',
  },
  {
    id: 'nutrition-plating',
    title: {
      en: 'Nutrition plating assistant',
      'zh-Hant': '營養擺盤助理',
      'zh-Hans': '营养摆盘助理',
    },
    programme: {
      en: 'Nutrition',
      'zh-Hant': '營養',
      'zh-Hans': '营养',
    },
    when: {
      en: 'Thu 21 Aug · 11:00–12:30',
      'zh-Hant': '8月21日（四）· 11:00–12:30',
      'zh-Hans': '8月21日（四）· 11:00–12:30',
    },
    place: {
      en: 'Wan Chai teaching kitchen',
      'zh-Hant': '灣仔教學廚房',
      'zh-Hans': '湾仔教学厨房',
    },
    placeHiddenUntilSignup: false,
    source: 'internal',
    capacity: 3,
    spots_filled: 1,
    interested_count: 0,
    skills: ['kitchen', 'patient'],
    recruiting: true,
    description: {
      en: 'Prep ingredients, plate colourful meals with members, and share lunch at the end.',
      'zh-Hant': '預備食材、與學員一起擺盤，最後一起享用午餐。',
      'zh-Hans': '预备食材、与学员一起摆盘，最后一起享用午餐。',
    },
    age_note: {
      en: '16+. No professional kitchen experience required.',
      'zh-Hant': '16 歲或以上。無需專業廚房經驗。',
      'zh-Hans': '16 岁或以上。无需专业厨房经验。',
    },
    whatYouDo: {
      en: 'Chop, season, and plate side-by-side with members — then sit down to the meal you made together.',
      'zh-Hant': '與學員並肩切菜、調味、擺盤——再一起坐下來享用。',
      'zh-Hans': '与学员并肩切菜、调味、摆盘——再一起坐下来享用。',
    },
    group_note: {
      en: 'About 10 members · shared table at the end',
      'zh-Hant': '約 10 位學員 · 結束時共享餐桌',
      'zh-Hans': '约 10 位学员 · 结束时共享餐桌',
    },
    youth14: false,
    image: '/brand/member.jpg',
  },
]

export function getOpportunity(id: string) {
  return opportunities.find((o) => o.id === id)
}

export function filterOpportunities(skills: VolunteerSkill[]) {
  if (skills.length === 0) return opportunities
  return opportunities.filter((o) => skills.some((s) => o.skills.includes(s)))
}
