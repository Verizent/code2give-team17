import type { Locale } from '@/lib/strings'

/**
 * Mock data layer. Everything the home page renders comes from here so it can
 * later be swapped for a real API by changing only this file.
 */

export type Localized = Record<Locale, string>

export type Activity = {
  id: string
  title: Localized
  date: Localized
  place: Localized
  category: Localized
  recruiting: boolean
  accent: 'teal' | 'pink' | 'yellow' | 'navy'
}

export type Spotlight = {
  id: string
  achievement: Localized
  name: string
  detail: Localized
  category: Localized
  accent: 'teal' | 'pink' | 'yellow' | 'navy'
}

export type Place = {
  id: string
  name: Localized
  activity: Localized
  lat: number
  lng: number
}

/** Neighbourhoods across Hong Kong where Love 21 activities happen. */
export const places: Place[] = [
  {
    id: 'kennedy-town',
    name: { en: 'Kennedy Town', 'zh-Hant': '堅尼地城', 'zh-Hans': '坚尼地城' },
    activity: { en: 'Dance studio', 'zh-Hant': '舞蹈工作室', 'zh-Hans': '舞蹈工作室' },
    lat: 22.2818,
    lng: 114.1287,
  },
  {
    id: 'sai-ying-pun',
    name: { en: 'Sai Ying Pun', 'zh-Hant': '西營盤', 'zh-Hans': '西营盘' },
    activity: { en: 'Community café', 'zh-Hant': '社區咖啡店', 'zh-Hans': '社区咖啡店' },
    lat: 22.2857,
    lng: 114.1425,
  },
  {
    id: 'sheung-wan',
    name: { en: 'Sheung Wan', 'zh-Hant': '上環', 'zh-Hans': '上环' },
    activity: { en: 'Art studio', 'zh-Hant': '藝術工作室', 'zh-Hans': '艺术工作室' },
    lat: 22.2867,
    lng: 114.15,
  },
  {
    id: 'wan-chai',
    name: { en: 'Wan Chai', 'zh-Hant': '灣仔', 'zh-Hans': '湾仔' },
    activity: { en: 'Teaching kitchen', 'zh-Hant': '教學廚房', 'zh-Hans': '教学厨房' },
    lat: 22.2779,
    lng: 114.1731,
  },
  {
    id: 'stanley',
    name: { en: 'Stanley', 'zh-Hant': '赤柱', 'zh-Hans': '赤柱' },
    activity: { en: 'Dragon-boat crew', 'zh-Hant': '龍舟隊', 'zh-Hans': '龙舟队' },
    lat: 22.2176,
    lng: 114.213,
  },
]

export const activities: Activity[] = [
  {
    id: 'dance-class',
    title: {
      en: 'Saturday dance class',
      'zh-Hant': '週六舞蹈班',
      'zh-Hans': '周六舞蹈班',
    },
    date: { en: 'Sat 9 Aug · 10:00', 'zh-Hant': '8月9日（六）· 10:00', 'zh-Hans': '8月9日（六）· 10:00' },
    place: { en: 'Kennedy Town studio', 'zh-Hant': '堅尼地城工作室', 'zh-Hans': '坚尼地城工作室' },
    category: { en: 'Movement', 'zh-Hant': '律動', 'zh-Hans': '律动' },
    recruiting: true,
    accent: 'pink',
  },
  {
    id: 'cafe-shift',
    title: {
      en: 'Community café shift',
      'zh-Hant': '社區咖啡店當值',
      'zh-Hans': '社区咖啡店当值',
    },
    date: { en: 'Tue 12 Aug · 14:00', 'zh-Hant': '8月12日（二）· 14:00', 'zh-Hans': '8月12日（二）· 14:00' },
    place: { en: 'Sai Ying Pun', 'zh-Hant': '西營盤', 'zh-Hans': '西营盘' },
    category: { en: 'Work skills', 'zh-Hant': '工作技能', 'zh-Hans': '工作技能' },
    recruiting: true,
    accent: 'teal',
  },
  {
    id: 'dragon-boat',
    title: {
      en: 'Dragon-boat training',
      'zh-Hant': '龍舟訓練',
      'zh-Hans': '龙舟训练',
    },
    date: { en: 'Sun 17 Aug · 08:30', 'zh-Hant': '8月17日（日）· 08:30', 'zh-Hans': '8月17日（日）· 08:30' },
    place: { en: 'Stanley Main Beach', 'zh-Hant': '赤柱正灘', 'zh-Hans': '赤柱正滩' },
    category: { en: 'Sport', 'zh-Hant': '運動', 'zh-Hans': '运动' },
    recruiting: false,
    accent: 'navy',
  },
  {
    id: 'cooking',
    title: {
      en: 'Cook & share lunch',
      'zh-Hant': '烹飪共享午餐',
      'zh-Hans': '烹饪共享午餐',
    },
    date: { en: 'Thu 21 Aug · 11:00', 'zh-Hant': '8月21日（四）· 11:00', 'zh-Hans': '8月21日（四）· 11:00' },
    place: { en: 'Wan Chai kitchen', 'zh-Hant': '灣仔廚房', 'zh-Hans': '湾仔厨房' },
    category: { en: 'Life skills', 'zh-Hant': '生活技能', 'zh-Hans': '生活技能' },
    recruiting: true,
    accent: 'yellow',
  },
  {
    id: 'art-studio',
    title: {
      en: 'Open art studio',
      'zh-Hant': '開放藝術工作室',
      'zh-Hans': '开放艺术工作室',
    },
    date: { en: 'Fri 22 Aug · 15:00', 'zh-Hant': '8月22日（五）· 15:00', 'zh-Hans': '8月22日（五）· 15:00' },
    place: { en: 'Sheung Wan', 'zh-Hant': '上環', 'zh-Hans': '上环' },
    category: { en: 'Art', 'zh-Hant': '藝術', 'zh-Hans': '艺术' },
    recruiting: false,
    accent: 'pink',
  },
]

/** Community story feed — activity-type filters */
export type ActivityType =
  | 'sport'
  | 'art'
  | 'nutrition'
  | 'family'
  | 'fitness'
  | 'special'
  | 'outings'
  | 'csr'

export const ACTIVITY_TYPES: ActivityType[] = [
  'sport',
  'art',
  'nutrition',
  'family',
  'fitness',
  'special',
  'outings',
  'csr',
]

export type Story = {
  id: string
  type: ActivityType
  title: Localized
  line: Localized
  author: string
  accent: 'teal' | 'pink' | 'yellow' | 'navy'
  /** Placeholder photo height variety for masonry */
  photoH: 'sm' | 'md' | 'lg'
}

export type KnowledgeKind = 'dots' | 'slider'

export type KnowledgeStat = {
  id: string
  kind: KnowledgeKind
  headline: Localized
  body: Localized
  /** Insert after this many stories in the unfiltered feed */
  afterStoryCount: number
}

export type FollowProgram = {
  id: string
  type: ActivityType
  name: Localized
  blurb: Localized
  accent: 'teal' | 'pink' | 'yellow' | 'navy'
}

export const stories: Story[] = [
  {
    id: 's1',
    type: 'sport',
    title: {
      en: 'Paddled the full 500 metres',
      'zh-Hant': '划完全程 500 米',
      'zh-Hans': '划完全程 500 米',
    },
    line: {
      en: 'Our crew hit the water at Stanley before breakfast.',
      'zh-Hant': '我們的隊伍在早餐前就下水了。',
      'zh-Hans': '我们的队伍在早餐前就下水了。',
    },
    author: 'Tom',
    accent: 'navy',
    photoH: 'lg',
  },
  {
    id: 's2',
    type: 'art',
    title: {
      en: 'Sold three paintings before noon',
      'zh-Hant': '中午前售出三幅畫',
      'zh-Hans': '中午前售出三幅画',
    },
    line: {
      en: 'Aya priced each piece herself at the weekend market.',
      'zh-Hant': 'Aya 在週末市集親自為每幅畫定價。',
      'zh-Hans': 'Aya 在周末市集亲自为每幅画定价。',
    },
    author: 'Aya',
    accent: 'yellow',
    photoH: 'md',
  },
  {
    id: 's3',
    type: 'art',
    title: {
      en: 'Led warm-ups for thirty dancers',
      'zh-Hant': '為三十位舞者帶領熱身',
      'zh-Hans': '为三十位舞者带领热身',
    },
    line: {
      en: 'Saturday mornings start with Ken counting the beats.',
      'zh-Hant': '週六早上從 Ken 打拍子開始。',
      'zh-Hans': '周六早上从 Ken 打拍子开始。',
    },
    author: 'Ken',
    accent: 'pink',
    photoH: 'sm',
  },
  {
    id: 's4',
    type: 'nutrition',
    title: {
      en: 'Cooked lunch for twelve friends',
      'zh-Hant': '為十二位朋友煮午餐',
      'zh-Hans': '为十二位朋友煮午餐',
    },
    line: {
      en: 'Chopped, seasoned, plated — and no leftovers.',
      'zh-Hant': '切菜、調味、擺盤——一點也不剩。',
      'zh-Hans': '切菜、调味、摆盘——一点也不剩。',
    },
    author: 'Sam',
    accent: 'yellow',
    photoH: 'md',
  },
  {
    id: 's5',
    type: 'family',
    title: {
      en: 'Cheered from the front row',
      'zh-Hant': '在第一排加油打氣',
      'zh-Hans': '在第一排加油打气',
    },
    line: {
      en: 'Mum brought handmade signs for every name on the team.',
      'zh-Hant': '媽媽為隊上每個名字做了手舉牌。',
      'zh-Hans': '妈妈为队上每个名字做了手举牌。',
    },
    author: 'Mrs. Chan',
    accent: 'teal',
    photoH: 'sm',
  },
  {
    id: 's6',
    type: 'fitness',
    title: {
      en: 'Finished a full circuit without stopping',
      'zh-Hant': '不停歇完成一整輪訓練',
      'zh-Hans': '不停歇完成一整轮训练',
    },
    line: {
      en: 'Twenty minutes of strength — and a high-five at the end.',
      'zh-Hant': '二十分鐘肌力訓練——結束時擊掌。',
      'zh-Hans': '二十分钟肌力训练——结束时击掌。',
    },
    author: 'Leo',
    accent: 'teal',
    photoH: 'lg',
  },
  {
    id: 's7',
    type: 'special',
    title: {
      en: 'Opened the annual ability night',
      'zh-Hant': '揭開年度能力之夜',
      'zh-Hans': '揭开年度能力之夜',
    },
    line: {
      en: 'The hall went quiet — then stood for the first bow.',
      'zh-Hant': '禮堂安靜下來——然後為第一個鞠躬起立。',
      'zh-Hans': '礼堂安静下来——然后为第一个鞠躬起立。',
    },
    author: 'Winnie',
    accent: 'pink',
    photoH: 'md',
  },
  {
    id: 's8',
    type: 'outings',
    title: {
      en: 'Found the harbour ferry by ourselves',
      'zh-Hant': '自己找到了海港渡輪',
      'zh-Hans': '自己找到了海港渡轮',
    },
    line: {
      en: 'Maps, tickets, and a picnic on the upper deck.',
      'zh-Hant': '地圖、船票，還有上層甲板的野餐。',
      'zh-Hans': '地图、船票，还有上层甲板的野餐。',
    },
    author: 'Jay',
    accent: 'navy',
    photoH: 'sm',
  },
  {
    id: 's9',
    type: 'csr',
    title: {
      en: 'Hosted thirty colleagues for a café shift',
      'zh-Hant': '接待三十位同事來咖啡店當值',
      'zh-Hans': '接待三十位同事来咖啡店当值',
    },
    line: {
      en: 'Mei showed them how the morning rush really works.',
      'zh-Hant': 'Mei 教他們早班高峰真正怎麼運作。',
      'zh-Hans': 'Mei 教他们早班高峰真正怎么运作。',
    },
    author: 'Mei',
    accent: 'teal',
    photoH: 'md',
  },
  {
    id: 's10',
    type: 'sport',
    title: {
      en: 'Scored the equaliser in the last minute',
      'zh-Hant': '最後一分鐘追平比分',
      'zh-Hans': '最后一分钟追平比分',
    },
    line: {
      en: 'The bench emptied onto the pitch.',
      'zh-Hant': '替補席全衝進球場。',
      'zh-Hans': '替补席全冲进球场。',
    },
    author: 'Chris',
    accent: 'navy',
    photoH: 'lg',
  },
  {
    id: 's11',
    type: 'art',
    title: {
      en: 'Played the opening bars on stage',
      'zh-Hant': '在舞台上奏出開場樂句',
      'zh-Hans': '在舞台上奏出开场乐句',
    },
    line: {
      en: 'Hands steady. Tempo true. Applause loud.',
      'zh-Hant': '手很穩。節奏準。掌聲很大。',
      'zh-Hans': '手很稳。节奏准。掌声很大。',
    },
    author: 'Nina',
    accent: 'pink',
    photoH: 'sm',
  },
  {
    id: 's12',
    type: 'family',
    title: {
      en: 'Taught Dad a new dance step',
      'zh-Hant': '教爸爸一個新舞步',
      'zh-Hans': '教爸爸一个新舞步',
    },
    line: {
      en: 'He still gets the left foot wrong — proudly.',
      'zh-Hant': '他左腳還是踏錯——但很自豪。',
      'zh-Hans': '他左脚还是踏错——但很自豪。',
    },
    author: 'Ellie',
    accent: 'yellow',
    photoH: 'md',
  },
]

export const knowledgeStats: KnowledgeStat[] = [
  {
    id: 'k-dots',
    kind: 'dots',
    afterStoryCount: 2,
    headline: {
      en: '1 in 700 babies are born with Down syndrome',
      'zh-Hant': '每 700 名嬰兒中有 1 名天生唐氏綜合症',
      'zh-Hans': '每 700 名婴儿中有 1 名天生唐氏综合症',
    },
    body: {
      en: 'One lit dot among seven hundred — that is how common it is.',
      'zh-Hant': '七百個點裡點亮一個——就是這樣常見。',
      'zh-Hans': '七百个点里点亮一个——就是这样常见。',
    },
  },
  {
    id: 'k-slider',
    kind: 'slider',
    afterStoryCount: 5,
    headline: {
      en: 'Fewer than 15% are in competitive employment',
      'zh-Hant': '少於 15% 能進入競爭性就業',
      'zh-Hans': '少于 15% 能进入竞争性就业',
    },
    body: {
      en: 'Guess the figure, then see the truth. Ability is here — opportunity is not.',
      'zh-Hant': '先猜一個數字，再看真相。能力在這裡——機會還不夠。',
      'zh-Hans': '先猜一个数字，再看真相。能力在这里——机会还不够。',
    },
  },
]

export const followPrograms: FollowProgram[] = [
  {
    id: 'dragon-boat',
    type: 'sport',
    name: {
      en: 'Dragon boat',
      'zh-Hant': '龍舟',
      'zh-Hans': '龙舟',
    },
    blurb: {
      en: 'Training mornings and race days around Stanley.',
      'zh-Hant': '赤柱一帶的訓練晨練與比賽日。',
      'zh-Hans': '赤柱一带的训练晨练与比赛日。',
    },
    accent: 'navy',
  },
  {
    id: 'dance',
    type: 'art',
    name: {
      en: 'Dance',
      'zh-Hant': '舞蹈',
      'zh-Hans': '舞蹈',
    },
    blurb: {
      en: 'Saturday studio sessions led by our members.',
      'zh-Hant': '由學員帶領的週六工作室課堂。',
      'zh-Hans': '由学员带领的周六工作室课堂。',
    },
    accent: 'pink',
  },
  {
    id: 'cafe',
    type: 'csr',
    name: {
      en: 'Community café',
      'zh-Hant': '社區咖啡店',
      'zh-Hans': '社区咖啡店',
    },
    blurb: {
      en: 'Real shifts, real customers, real skills.',
      'zh-Hant': '真實當值、真實客人、真實技能。',
      'zh-Hans': '真实当值、真实客人、真实技能。',
    },
    accent: 'teal',
  },
  {
    id: 'art-studio',
    type: 'art',
    name: {
      en: 'Art studio',
      'zh-Hant': '藝術工作室',
      'zh-Hans': '艺术工作室',
    },
    blurb: {
      en: 'Open studio hours and market days in Sheung Wan.',
      'zh-Hant': '上環開放工作室時段與市集日。',
      'zh-Hans': '上环开放工作室时段与市集日。',
    },
    accent: 'yellow',
  },
  {
    id: 'cook-share',
    type: 'nutrition',
    name: {
      en: 'Cook & share',
      'zh-Hant': '烹飪共享',
      'zh-Hans': '烹饪共享',
    },
    blurb: {
      en: 'Kitchen skills that end at a shared table.',
      'zh-Hant': '從廚房技巧走到共享餐桌。',
      'zh-Hans': '从厨房技巧走到共享餐桌。',
    },
    accent: 'yellow',
  },
  {
    id: 'fitness-circuit',
    type: 'fitness',
    name: {
      en: 'Fitness circuit',
      'zh-Hant': '體能循環',
      'zh-Hans': '体能循环',
    },
    blurb: {
      en: 'Strength sessions with coaches who cheer loudly.',
      'zh-Hant': '教練大聲加油的肌力訓練。',
      'zh-Hans': '教练大声加油的肌力训练。',
    },
    accent: 'teal',
  },
]

export const spotlights: Spotlight[] = [
  {
    id: 'ken',
    achievement: {
      en: 'Teaches our dance class.',
      'zh-Hant': '教授我們的舞蹈班。',
      'zh-Hans': '教授我们的舞蹈班。',
    },
    name: 'Ken',
    detail: {
      en: 'Ken leads warm-ups for thirty dancers every Saturday morning.',
      'zh-Hant': 'Ken 每個週六早上為三十位舞者帶領熱身。',
      'zh-Hans': 'Ken 每个周六早上为三十位舞者带领热身。',
    },
    category: { en: 'Coach', 'zh-Hant': '教練', 'zh-Hans': '教练' },
    accent: 'pink',
  },
  {
    id: 'mei',
    achievement: {
      en: 'Holds a real job at a café.',
      'zh-Hant': '在咖啡店有一份真正的工作。',
      'zh-Hans': '在咖啡店有一份真正的工作。',
    },
    name: 'Mei',
    detail: {
      en: 'Mei runs the morning coffee bar and knows every regular by name.',
      'zh-Hant': 'Mei 負責早班咖啡吧，記得每位常客的名字。',
      'zh-Hans': 'Mei 负责早班咖啡吧，记得每位常客的名字。',
    },
    category: { en: 'Barista', 'zh-Hant': '咖啡師', 'zh-Hans': '咖啡师' },
    accent: 'teal',
  },
  {
    id: 'tom',
    achievement: {
      en: 'Finished the dragon-boat race.',
      'zh-Hant': '完成了龍舟比賽。',
      'zh-Hans': '完成了龙舟比赛。',
    },
    name: 'Tom',
    detail: {
      en: 'Tom paddled all 500 metres with his crew and crossed the line.',
      'zh-Hant': 'Tom 與隊友划完全程 500 米，衝過終點。',
      'zh-Hans': 'Tom 与队友划完全程 500 米，冲过终点。',
    },
    category: { en: 'Athlete', 'zh-Hant': '運動員', 'zh-Hans': '运动员' },
    accent: 'navy',
  },
  {
    id: 'aya',
    achievement: {
      en: 'Sells her paintings at market.',
      'zh-Hant': '在市集售賣自己的畫作。',
      'zh-Hans': '在市集售卖自己的画作。',
    },
    name: 'Aya',
    detail: {
      en: 'Aya priced, framed and sold out her first collection this spring.',
      'zh-Hant': 'Aya 今個春天為首個系列定價、裱框並售罄。',
      'zh-Hans': 'Aya 今个春天为首个系列定价、装裱并售罄。',
    },
    category: { en: 'Artist', 'zh-Hant': '藝術家', 'zh-Hans': '艺术家' },
    accent: 'yellow',
  },
]
