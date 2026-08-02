/**
 * Mock data layer. Everything the home page renders comes from here so it can
 * later be swapped for a real API by changing only this file.
 */

/** Neighbourhoods across Hong Kong where Love 21 activities happen. */
export const places = [
  {
    id: 'kennedy-town',
    name: { en: 'Kennedy Town', 'zh-Hant': '堅尼地城', 'zh-Hans': '坚尼地城' },
    activity: { en: 'Dance', 'zh-Hant': '舞蹈', 'zh-Hans': '舞蹈' },
    lat: 22.2818,
    lng: 114.1287,
  },
  {
    id: 'sai-ying-pun',
    name: { en: 'Sai Ying Pun', 'zh-Hant': '西營盤', 'zh-Hans': '西营盘' },
    activity: {
      en: 'Community & Education',
      'zh-Hant': '社區與教育',
      'zh-Hans': '社区与教育',
    },
    lat: 22.2857,
    lng: 114.1425,
  },
  {
    id: 'sheung-wan',
    name: { en: 'Sheung Wan', 'zh-Hant': '上環', 'zh-Hans': '上环' },
    activity: { en: 'Floor curling', 'zh-Hant': '地壺球', 'zh-Hans': '地壶球' },
    lat: 22.2867,
    lng: 114.15,
  },
  {
    id: 'wan-chai',
    name: { en: 'Wan Chai', 'zh-Hant': '灣仔', 'zh-Hans': '湾仔' },
    activity: { en: 'Nutrition', 'zh-Hant': '營養', 'zh-Hans': '营养' },
    lat: 22.2779,
    lng: 114.1731,
  },
  {
    id: 'stanley',
    name: { en: 'Stanley', 'zh-Hant': '赤柱', 'zh-Hans': '赤柱' },
    activity: {
      en: 'Dragon boat racing',
      'zh-Hant': '龍舟競賽',
      'zh-Hans': '龙舟竞赛',
    },
    lat: 22.2176,
    lng: 114.213,
  },
]

export const activities = [
  {
    id: 'dragon-boat',
    title: {
      en: 'Dragon boat racing',
      'zh-Hant': '龍舟競賽',
      'zh-Hans': '龙舟竞赛',
    },
    date: { en: 'Sun 17 Aug · 08:30', 'zh-Hant': '8月17日（日）· 08:30', 'zh-Hans': '8月17日（日）· 08:30' },
    place: { en: 'Stanley Main Beach', 'zh-Hant': '赤柱正灘', 'zh-Hans': '赤柱正滩' },
    category: { en: 'Sports', 'zh-Hant': '運動', 'zh-Hans': '运动' },
    recruiting: false,
    accent: 'navy',
  },
  {
    id: 'zumba',
    title: {
      en: 'Zumba class',
      'zh-Hant': '尊巴課',
      'zh-Hans': '尊巴课',
    },
    date: { en: 'Sat 9 Aug · 10:00', 'zh-Hant': '8月9日（六）· 10:00', 'zh-Hans': '8月9日（六）· 10:00' },
    place: { en: 'Kennedy Town', 'zh-Hant': '堅尼地城', 'zh-Hans': '坚尼地城' },
    category: { en: 'Sports', 'zh-Hant': '運動', 'zh-Hans': '运动' },
    recruiting: true,
    accent: 'pink',
  },
  {
    id: 'circuit-training',
    title: {
      en: 'Circuit training',
      'zh-Hant': '循環訓練',
      'zh-Hans': '循环训练',
    },
    date: { en: 'Tue 12 Aug · 14:00', 'zh-Hant': '8月12日（二）· 14:00', 'zh-Hans': '8月12日（二）· 14:00' },
    place: { en: 'Sheung Wan', 'zh-Hant': '上環', 'zh-Hans': '上环' },
    category: { en: 'Sports', 'zh-Hant': '運動', 'zh-Hans': '运动' },
    recruiting: true,
    accent: 'teal',
  },
  {
    id: 'nutrition-lunch',
    title: {
      en: 'Cook & share lunch',
      'zh-Hant': '烹飪共享午餐',
      'zh-Hans': '烹饪共享午餐',
    },
    date: { en: 'Thu 21 Aug · 11:00', 'zh-Hant': '8月21日（四）· 11:00', 'zh-Hans': '8月21日（四）· 11:00' },
    place: { en: 'Wan Chai kitchen', 'zh-Hant': '灣仔廚房', 'zh-Hans': '湾仔厨房' },
    category: { en: 'Nutrition', 'zh-Hant': '營養', 'zh-Hans': '营养' },
    recruiting: true,
    accent: 'yellow',
  },
  {
    id: 'family-bocce',
    title: {
      en: 'Family bocce morning',
      'zh-Hant': '家庭地擲球晨聚',
      'zh-Hans': '家庭地掷球晨聚',
    },
    date: { en: 'Fri 22 Aug · 15:00', 'zh-Hant': '8月22日（五）· 15:00', 'zh-Hans': '8月22日（五）· 15:00' },
    place: { en: 'Sai Ying Pun', 'zh-Hant': '西營盤', 'zh-Hans': '西营盘' },
    category: {
      en: 'Family Support',
      'zh-Hant': '家庭支援',
      'zh-Hans': '家庭支援',
    },
    recruiting: true,
    accent: 'pink',
  },
]

/**
 * Fallback for GET /api/impact — same shape as the server response (server/src/
 * services/content/impact.service.js), so mock and real mode render identically.
 * Used when VITE_API_MODE=mock, and as a safety net if the real call fails.
 * Numbers are the 2024–25 annual report figures (CONTEXT.md §3).
 */
export const impactFixture = {
  label: '2024–25',
  period_start: '2024-07-01',
  period_end: '2025-06-30',
  families_served: 490,
  total_sessions: 6859,
  activity_types: 84,
  yoy_growth_pct: 30,
  programme_spend_pct: 86,
  by_programme: { sports: 2792, fitness: 1504, nutrition: 1489, family_support: 930 },
}

/**
 * Collective milestones for the Home page "Achievements & Impact" band.
 * No individual names — these are org-level facts, safe to publish as-is.
 * `icon` maps to a lucide-react icon in achievements-band.jsx.
 */
export const achievements = [
  {
    id: 'para-karate',
    icon: 'medal',
    headline: {
      en: 'Medals at the Asian Para-Karate Championships',
      'zh-Hant': '亞洲殘障空手道錦標賽獎牌',
      'zh-Hans': '亚洲残障空手道锦标赛奖牌',
    },
    detail: { en: 'Bali, Indonesia', 'zh-Hant': '印尼峇里島', 'zh-Hans': '印尼巴厘岛' },
  },
  {
    id: 'special-olympics',
    icon: 'trophy',
    headline: {
      en: 'Members preparing for the Special Olympics',
      'zh-Hant': '學員正備戰特殊奧運會',
      'zh-Hans': '学员正备战特殊奥运会',
    },
    detail: { en: 'In active training now', 'zh-Hant': '目前正密集訓練中', 'zh-Hans': '目前正密集训练中' },
  },
  {
    id: 'employment-training',
    icon: 'graduation-cap',
    headline: {
      en: '26 members completed employment training',
      'zh-Hant': '26 位學員完成就業培訓',
      'zh-Hans': '26 位学员完成就业培训',
    },
    detail: null,
  },
  {
    id: 'phoenix-year',
    icon: 'flame',
    headline: {
      en: 'Rebuilt into a larger, two-floor centre',
      'zh-Hant': '重建為更大的兩層中心',
      'zh-Hans': '重建为更大的两层中心',
    },
    detail: {
      en: 'After a 2023 fire — "our phoenix year"',
      'zh-Hant': '在 2023 年一場火災後——「我們的鳳凰之年」',
      'zh-Hans': '在 2023 年一场火灾后——“我们的凤凰之年”',
    },
  },
]

/**
 * Real corporate-partner volunteering, from Love 21's public media. Kept as
 * org-level testimonials — Ben Hammond is the only named individual, and he
 * is quoted in his professional capacity, not as a service recipient.
 */
export const corporatePartners = [
  {
    id: 'morgan-stanley',
    org: 'Morgan Stanley',
    quote: {
      en: '80+ Morgan Stanley employees have volunteered — arts and crafts, African drumming, cooking classes, and Zumba.',
      'zh-Hant': '超過 80 位摩根士丹利員工參與義工服務——手工藝、非洲鼓、烹飪課和尊巴舞。',
      'zh-Hans': '超过 80 位摩根士丹利员工参与志愿服务——手工艺、非洲鼓、烹饪课和尊巴舞。',
    },
    attribution: null,
  },
  {
    id: 'ashurst',
    org: 'Ashurst Hong Kong',
    quote: {
      en: 'Ashurst colleagues joined African drumming and Zumba alongside our members, and hosted Christmas workshops — extended to their clients too.',
      'zh-Hant': 'Ashurst 的同事與學員一起參與非洲鼓和尊巴舞，並舉辦聖誕工作坊——更延伸至他們的客戶。',
      'zh-Hans': 'Ashurst 的同事与学员一起参与非洲鼓和尊巴舞，并举办圣诞工作坊——更延伸至他们的客户。',
    },
    attribution: 'Ben Hammond',
  },
]

/**
 * Real supporters named in Love 21's 2024–25 annual report "Acknowledgement"
 * page plus verified CSR/pro-bono partners — org names only (no logos; see
 * AchievementsBand for why). Kept as plain strings, not translated: these
 * are proper nouns and read the same in all three locales.
 */
export const corporatePartnerNames = [
  'Morgan Stanley',
  'HSBC',
  'Ashurst',
  'UBS',
  'BlackRock',
  'Bloomberg',
  'Clifford Chance',
  'Slaughter and May',
  'The Hong Kong Jockey Club Charities Trust',
  'The Royal Hong Kong Yacht Club Charity Foundation',
  'The Community Chest of Hong Kong',
  'HandsOn Hong Kong',
]

/**
 * Real media & press coverage, sourced from love21foundation.com/media —
 * titles, dates, and urls match the original articles. Photos are our own
 * brand photography (not screenshots of the press pages) for visual quality.
 */
export const mediaItems = [
  {
    id: 'beyond-limits-banquet-2026',
    title: {
      en: 'Tables & Seats Now Open for Beyond Limits Banquet',
      'zh-Hant': '「同心舞台」慈善晚宴 座位現已開放報名',
      'zh-Hans': '「同心舞台」慈善晚宴 座位现已开放报名',
    },
    date: { en: 'May 2026', 'zh-Hant': '2026 年 5 月', 'zh-Hans': '2026 年 5 月' },
    image: '/brand/hero-group.jpg',
    url: 'https://love21foundation.com/beyond-limits-banquet/',
  },
  {
    id: 'raffle-2025',
    title: {
      en: 'Love 21 Foundation Charity Raffle 2025',
      'zh-Hant': 'Love 21 基金會慈善抽獎 2025',
      'zh-Hans': 'Love 21 基金会慈善抽奖 2025',
    },
    date: { en: 'November 2025', 'zh-Hant': '2025 年 11 月', 'zh-Hans': '2025 年 11 月' },
    image: '/brand/hero-huddle.jpg',
    url: 'https://love21foundation.com/raffle2025-2/',
  },
  {
    id: 'around-the-ward-2022',
    title: {
      en: 'Around the Ward: protecting children with special needs through the pandemic',
      'zh-Hant': '【繞場一週】守護特殊兒童對抗疫境',
      'zh-Hans': '【绕场一周】守护特殊儿童对抗疫境',
    },
    date: { en: 'May 2022', 'zh-Hant': '2022 年 5 月', 'zh-Hans': '2022 年 5 月' },
    image: '/brand/class.jpg',
    url: 'https://love21foundation.com/%e3%80%90%e7%b9%9e%e5%a0%b4%e4%b8%80%e9%80%b1%e3%80%91%e5%ae%88%e8%ad%b7%e7%89%b9%e6%ae%8a%e5%85%92%e7%ab%a5%e5%b0%8d%e6%8a%97%e7%96%ab%e5%a2%83/',
  },
  {
    id: 'love-simply-interview-2021',
    title: {
      en: 'Health feature interview: Love, simply',
      'zh-Hant': '精靈一點 健康人物專訪 — 愛．很簡單',
      'zh-Hans': '精灵一点 健康人物专访 — 爱．很简单',
    },
    date: { en: 'December 2021', 'zh-Hant': '2021 年 12 月', 'zh-Hans': '2021 年 12 月' },
    image: '/brand/hero-climb.jpg',
    url: 'https://love21foundation.com/%e7%b2%be%e9%9d%88%e4%b8%80%e9%bb%9e-%e5%81%a5%e5%ba%b7%e4%ba%ba%e7%89%a9%e5%b0%88%e8%a8%aa-%e6%84%9b%c2%b7%e5%be%88%e7%b0%a1%e5%96%ae/',
  },
  {
    id: 'long-happy-life-2021',
    title: {
      en: "Love 21's open secret to a long, happy life",
      'zh-Hant': 'Love 21 的長壽快樂公開秘訣',
      'zh-Hans': 'Love 21 的长寿快乐公开秘诀',
    },
    date: { en: 'November 2021', 'zh-Hant': '2021 年 11 月', 'zh-Hans': '2021 年 11 月' },
    image: '/brand/activity.jpg',
    url: 'https://love21foundation.com/love-21s-open-secret-to-a-long-happy-life/',
  },
  {
    id: 'purposeful-employment-2021',
    title: {
      en: "Hong Kong's Love 21 Foundation aims to prove those with Down's syndrome, autism ready for purposeful employment",
      'zh-Hant': '香港 Love 21 基金會：證明唐氏綜合症、自閉症人士已準備好投入有意義的工作',
      'zh-Hans': '香港 Love 21 基金会：证明唐氏综合症、自闭症人士已准备好投入有意义的工作',
    },
    date: { en: 'November 2021', 'zh-Hant': '2021 年 11 月', 'zh-Hans': '2021 年 11 月' },
    image: '/brand/hero-group.jpg',
    url: 'https://love21foundation.com/hong-kongs-love-21-foundation-aims/',
  },
  {
    id: 'dragon-boating-2021',
    title: {
      en: 'Hong Kong yacht club and charity team up to help special needs teens learn dragon boating',
      'zh-Hant': '香港遊艇會與慈善機構合作 助有特殊需要青少年學習划龍舟',
      'zh-Hans': '香港游艇会与慈善机构合作 助有特殊需要青少年学习划龙舟',
    },
    date: { en: 'September 2021', 'zh-Hant': '2021 年 9 月', 'zh-Hans': '2021 年 9 月' },
    image: '/brand/hero-huddle.jpg',
    url: 'https://love21foundation.com/hong-kong-yacht-club-and-charity-team-up-to-help-special-needs-teens-learn-dragon-boating/',
  },
  {
    id: 'free-diet-advice-2021',
    title: {
      en: 'Hong Kong charity offers free diet advice and guidance for children with intellectual disabilities in low-income families',
      'zh-Hant': '香港慈善機構為低收入家庭的智障兒童提供免費飲食建議及指導',
      'zh-Hans': '香港慈善机构为低收入家庭的智障儿童提供免费饮食建议及指导',
    },
    date: { en: 'May 2021', 'zh-Hant': '2021 年 5 月', 'zh-Hans': '2021 年 5 月' },
    image: '/brand/class.jpg',
    url: 'https://love21foundation.com/hong-kong-charity-offers-free-diet-advice-and-guidance-for-children-with-intellectual-disabilities-in-low-income-families/',
  },
]

/** Community story feed — activity-type filters */
export const ACTIVITY_TYPES = [
  'sport',
  'art',
  'nutrition',
  'family',
  'fitness',
  'special',
  'outings',
  'csr',
]

/** Live count for the Ability Wall header. Bump as real moments are logged. */
export const MOMENTS_OF_ABILITY_COUNT = 1247

/**
 * "Share a moment" submitter relationship — matches the `relationship` values
 * used in server/db/seed/community-posts.seed.js (POST /api/community-posts
 * expects any non-empty string, but these three keep the form/seed consistent).
 */
export const RELATIONSHIP_OPTIONS = ['volunteer', 'parent', 'supporter']

/**
 * DEMO-ONLY signed-in profile for the Share-a-moment form. There is no real
 * login screen yet — swap this for the real Supabase Auth session later.
 */
export const DEMO_SIGNED_IN_PROFILE = {
  name: {
    en: 'A Love 21 volunteer',
    'zh-Hant': '一位 Love 21 義工',
    'zh-Hans': '一位 Love 21 志愿者',
  },
}

/**
 * "Your First Session" — interactive 3-step narrative for the Community page.
 * Simulates the first-time VOLUNTEER experience (never disability) to bust
 * myths. Facts kept accurate: class size 8–12, ages 6–45, ~1 open volunteer
 * spot per session, role is an active participant, not an observer.
 */
export const firstSessionSteps = [
  {
    id: 'arrival',
    scene: {
      en: 'You arrive at Love 21. The coach says: "Today we\'re doing a K-pop dance class — 10 members, ages 6 to 45."',
      'zh-Hant': '你來到 Love 21。教練說：「今天是 K-pop 跳舞課——10 位學員，年齡 6 至 45 歲。」',
      'zh-Hans': '你来到 Love 21。教练说：“今天是 K-pop 跳舞课——10 位学员，年龄 6 至 45 岁。”',
    },
    choices: [
      {
        id: 'watch',
        label: { en: 'Watch for a bit first', 'zh-Hant': '先在旁邊看一下', 'zh-Hans': '先在旁边看一下' },
      },
      {
        id: 'jump-in',
        label: { en: 'Jump in and dance along', 'zh-Hant': '直接加入一起跳', 'zh-Hans': '直接加入一起跳' },
      },
    ],
    reveal: {
      en: "Every volunteer feels this way the first time. The trick isn't teaching them the steps — it's following their energy.",
      'zh-Hant': '每位義工第一次都是這種感覺。訣竅不是教他們步伐——而是跟著他們的能量走。',
      'zh-Hans': '每位志愿者第一次都是这种感觉。诀窍不是教他们步伐——而是跟着他们的能量走。',
    },
  },
  {
    id: 'unexpected',
    scene: {
      en: "One member sits down mid-class and doesn't want to continue.",
      'zh-Hant': '一位學員在課堂中途坐下，不想繼續。',
      'zh-Hans': '一位学员在课堂中途坐下，不想继续。',
    },
    choices: [
      {
        id: 'coach',
        label: { en: 'Let the coach handle it', 'zh-Hant': '交給教練處理', 'zh-Hans': '交给教练处理' },
      },
      {
        id: 'sit-with',
        label: {
          en: "Sit down next to them and ask if they'd like to try a different move",
          'zh-Hant': '坐到他們旁邊，問問是否想試試別的動作',
          'zh-Hans': '坐到他们旁边，问问是否想试试别的动作',
        },
      },
    ],
    reveal: {
      en: 'However you responded, the class kept going. Coaches say it often: "They regulate themselves better than you\'d expect."',
      'zh-Hant': '不論你怎麼回應，課堂都會繼續。教練們常說：「他們自我調節的能力，比你想像中更好。」',
      'zh-Hans': '不论你怎么回应，课堂都会继续。教练们常说：“他们自我调节的能力，比你想象中更好。”',
    },
  },
  {
    id: 'close',
    // No choices — this step lands on the reveal directly, then hands off to /volunteer.
    scene: {
      en: "Forty minutes in, you're now leading a small group on your own.",
      'zh-Hant': '四十分鐘後，你已經在獨自帶領一個小組。',
      'zh-Hans': '四十分钟后，你已经在独自带领一个小组。',
    },
    reveal: {
      en: 'This is what volunteering here actually looks like — not watching, being needed. Sessions like this usually have room for exactly one volunteer. Right now, one is open.',
      'zh-Hant': '這就是在這裡做義工的真實模樣——不是旁觀，而是被需要。像這樣的課堂通常只有一個義工名額。現在，剛好有一個空缺。',
      'zh-Hans': '这就是在这里做志愿者的真实模样——不是旁观，而是被需要。像这样的课堂通常只有一个志愿者名额。现在，刚好有一个空缺。',
    },
    cta: {
      en: "See this week's openings",
      'zh-Hant': '查看本週的空缺',
      'zh-Hans': '查看本周的空缺',
    },
  },
]

// NOTE: this Ability Wall (photos, tags, celebrate counts) is a different data
// model from the backend's planned `community_posts` / Voices (text testimonial +
// consent + moderation, no photos or reactions — see server/src/schemas/
// community-post.schema.js). Not reconciled yet; needs a team decision before
// wiring this feed to a real API.
export const stories = [
  // Real: RHKYC × Love 21 dragon-boat programme, 2021 (love21foundation.com/media, SCMP).
  {
    id: 's1',
    type: 'sport',
    title: {
      en: 'Learned to race a dragon boat',
      'zh-Hant': '學會扒龍舟比賽',
      'zh-Hans': '学会扒龙舟比赛',
    },
    line: {
      en: 'Members train and compete in dragon boating with the Royal Hong Kong Yacht Club.',
      'zh-Hant': '會員與香港遊艇會一起練習及參與龍舟比賽。',
      'zh-Hans': '会员与香港游艇会一起练习及参与龙舟比赛。',
    },
    author: 'RHKYC × Love 21',
    accent: 'navy',
    images: ['/brand/hero-group.jpg', '/brand/activity.jpg'],
    celebrateCount: 342,
    postedAt: '2026-07-18',
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
    images: ['/brand/story.jpg', '/brand/class.jpg'],
    celebrateCount: 128,
    postedAt: '2026-07-29',
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
    images: ['/brand/hero-huddle.jpg', '/brand/member.jpg'],
    celebrateCount: 76,
    postedAt: '2026-07-31',
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
    images: ['/brand/family.jpg', '/brand/hero-group.jpg'],
    celebrateCount: 91,
    postedAt: '2026-07-11',
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
    images: ['/brand/activity.jpg', '/brand/hero-climb.jpg'],
    celebrateCount: 63,
    postedAt: '2026-06-25',
  },
  // Real: Love 21 Employment Training Programme, SCMP 8 Nov 2021 (love21foundation.com/media).
  {
    id: 's7',
    type: 'special',
    title: {
      en: 'Ready for real employment',
      'zh-Hant': '準備好投入真實職場',
      'zh-Hans': '准备好投入真实职场',
    },
    line: {
      en: 'Love 21 members train for real jobs — like receptionists and teaching assistants — not specially-designed roles, real ones.',
      'zh-Hant': 'Love 21 會員接受培訓，投身接待員、教學助理等真實職位——不是特別設計的崗位，是真正的工作。',
      'zh-Hans': 'Love 21 会员接受培训，投身接待员、教学助理等真实职位——不是特别设计的岗位，是真正的工作。',
    },
    author: 'Love 21 team',
    accent: 'pink',
    images: ['/brand/class.jpg', '/brand/csr.jpg'],
    celebrateCount: 210,
    postedAt: '2026-06-01',
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
    images: ['/brand/csr.jpg', '/brand/member.jpg'],
    celebrateCount: 88,
    postedAt: '2026-07-26',
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
    images: ['/brand/hero-huddle.jpg', '/brand/story.jpg'],
    celebrateCount: 156,
    postedAt: '2026-07-30',
  },

  // ---------------------------------------------------------------------------
  // Programme cards. DEMO-ONLY: curated seed content, not member submissions —
  // the real version draws these from `sessions` once that table is populated.
  //
  // Deliberately attributed to the PROGRAMME or PARTNER, never to an invented
  // named individual. Love 21 staff sit on the judging panel (§7), so writing
  // twenty first-person testimonials would put invented words in real members'
  // mouths. Every line below describes a programme the foundation publicly runs
  // (love21foundation.com — sport, nutrition, family and CSR; 500+ families,
  // 800+ sessions and 90+ activity types a month).
  // ---------------------------------------------------------------------------
  {
    id: 's11',
    type: 'sport',
    title: {
      en: 'Raced alongside the yacht club crew',
      'zh-Hant': '與遊艇會隊伍並肩競賽',
      'zh-Hans': '与游艇会队伍并肩竞赛',
    },
    line: {
      en: 'The dragon boat squad trains and competes with the Royal Hong Kong Yacht Club.',
      'zh-Hant': '龍舟隊與香港遊艇會一起訓練及比賽。',
      'zh-Hans': '龙舟队与香港游艇会一起训练及比赛。',
    },
    author: 'Dragon boat squad',
    accent: 'teal',
    images: ['/brand/dragonboat.jpeg'],
    celebrateCount: 214,
    postedAt: '2026-07-17',
  },
  {
    id: 's12',
    type: 'sport',
    title: {
      en: 'Graded up a belt',
      'zh-Hant': '晉升一級腰帶',
      'zh-Hans': '晋升一级腰带',
    },
    line: {
      en: 'Karate runs weekly, and grading day is the whole room watching one person.',
      'zh-Hant': '空手道每週上課，考級日全場都在看著一個人。',
      'zh-Hans': '空手道每周上课，考级日全场都在看着一个人。',
    },
    author: 'Karate class',
    accent: 'yellow',
    images: ['/brand/karate.jpeg'],
    celebrateCount: 187,
    postedAt: '2026-07-15',
  },
  {
    id: 's13',
    type: 'fitness',
    title: {
      en: 'Finished every station',
      'zh-Hant': '完成每一個訓練站',
      'zh-Hans': '完成每一个训练站',
    },
    line: {
      en: 'Circuit training moves through the whole room — nobody sits a station out.',
      'zh-Hant': '循環訓練走遍全場，沒有人會跳過任何一站。',
      'zh-Hans': '循环训练走遍全场，没有人会跳过任何一站。',
    },
    author: 'Circuit training',
    accent: 'pink',
    images: ['/brand/sports.jpeg'],
    celebrateCount: 143,
    postedAt: '2026-07-12',
  },
  {
    id: 's14',
    type: 'art',
    title: {
      en: 'Played the piece all the way through',
      'zh-Hant': '完整彈奏整首樂曲',
      'zh-Hans': '完整弹奏整首乐曲',
    },
    line: {
      en: 'Music class ends with whoever wants to play for everyone else.',
      'zh-Hant': '音樂課的結尾，是誰想演奏就為大家演奏。',
      'zh-Hans': '音乐课的结尾，是谁想演奏就为大家演奏。',
    },
    author: 'Music class',
    accent: 'navy',
    images: ['/brand/music.jpeg'],
    celebrateCount: 168,
    postedAt: '2026-07-10',
  },
  {
    id: 's15',
    type: 'art',
    title: {
      en: 'Learned the routine end to end',
      'zh-Hant': '從頭到尾學會整套舞蹈',
      'zh-Hans': '从头到尾学会整套舞蹈',
    },
    line: {
      en: 'Dance meets on Saturdays and the warm-up is led from the front.',
      'zh-Hant': '舞蹈班逢週六上課，熱身由前排帶領。',
      'zh-Hans': '舞蹈班逢周六上课，热身由前排带领。',
    },
    author: 'Dance class',
    accent: 'teal',
    images: ['/brand/music2.jpeg'],
    celebrateCount: 132,
    postedAt: '2026-07-08',
  },
  {
    id: 's16',
    type: 'nutrition',
    title: {
      en: 'Planned a week of meals',
      'zh-Hant': '規劃了一星期的餐單',
      'zh-Hans': '规划了一星期的餐单',
    },
    line: {
      en: 'Families meet a dietitian one to one — the programme has run since 2021.',
      'zh-Hant': '家庭與營養師一對一會面，此計劃自 2021 年起持續進行。',
      'zh-Hans': '家庭与营养师一对一会面，此计划自 2021 年起持续进行。',
    },
    author: 'Nutrition programme',
    accent: 'yellow',
    images: ['/brand/nutrition.jpeg'],
    celebrateCount: 121,
    postedAt: '2026-07-05',
  },
  {
    id: 's17',
    type: 'nutrition',
    title: {
      en: 'Cooked lunch for the whole table',
      'zh-Hant': '為整桌人做了午餐',
      'zh-Hans': '为整桌人做了午餐',
    },
    line: {
      en: 'Cooking workshops turn the nutrition plan into something you can eat.',
      'zh-Hant': '烹飪工作坊把營養計劃變成可以吃的東西。',
      'zh-Hans': '烹饪工作坊把营养计划变成可以吃的东西。',
    },
    author: 'Cooking workshop',
    accent: 'pink',
    images: ['/brand/nutritionprog.jpeg'],
    celebrateCount: 109,
    postedAt: '2026-07-03',
  },
  {
    id: 's18',
    type: 'family',
    title: {
      en: 'Parents got support of their own',
      'zh-Hant': '家長也獲得了屬於自己的支援',
      'zh-Hans': '家长也获得了属于自己的支援',
    },
    line: {
      en: 'Counselling for parents runs alongside the classes — carers need support too.',
      'zh-Hant': '家長輔導與課堂同步進行，照顧者同樣需要支援。',
      'zh-Hans': '家长辅导与课堂同步进行，照顾者同样需要支援。',
    },
    author: 'Family programme',
    accent: 'navy',
    images: ['/brand/family.jpg'],
    celebrateCount: 176,
    postedAt: '2026-07-01',
  },
  {
    id: 's19',
    type: 'family',
    title: {
      en: 'Three generations on the same floor',
      'zh-Hant': '三代人在同一個場地',
      'zh-Hans': '三代人在同一个场地',
    },
    line: {
      en: 'Family days put siblings, parents and grandparents into the same session.',
      'zh-Hant': '家庭日讓兄弟姊妹、父母與祖父母參與同一節活動。',
      'zh-Hans': '家庭日让兄弟姊妹、父母与祖父母参与同一节活动。',
    },
    author: 'Family day',
    accent: 'teal',
    images: ['/brand/grpphoto.jpeg'],
    celebrateCount: 154,
    postedAt: '2026-06-28',
  },
  {
    id: 's20',
    type: 'special',
    title: {
      en: 'Filled the room for Beyond Limits',
      'zh-Hant': '「超越極限」晚宴座無虛席',
      'zh-Hans': '「超越极限」晚宴座无虚席',
    },
    line: {
      en: 'The Beyond Limits Banquet is the signature fundraising night of the year.',
      'zh-Hant': '「超越極限」慈善晚宴是年度重點籌款之夜。',
      'zh-Hans': '「超越极限」慈善晚宴是年度重点筹款之夜。',
    },
    author: 'Beyond Limits Banquet',
    accent: 'yellow',
    images: ['/brand/beyondlimit.jpeg'],
    celebrateCount: 231,
    postedAt: '2026-06-25',
  },
  {
    id: 's21',
    type: 'special',
    title: {
      en: 'Raffle tickets went out the door',
      'zh-Hant': '抽獎券迅速售罄',
      'zh-Hans': '抽奖券迅速售罄',
    },
    line: {
      en: 'The charity raffle funds the classes that stay free for members.',
      'zh-Hant': '慈善抽獎為會員免費課堂提供資金。',
      'zh-Hans': '慈善抽奖为会员免费课堂提供资金。',
    },
    author: 'Charity raffle',
    accent: 'pink',
    images: ['/brand/charityraffle.jpeg'],
    celebrateCount: 98,
    postedAt: '2026-06-22',
  },
  {
    id: 's22',
    type: 'csr',
    title: {
      en: 'A firm swapped desks for fitness stations',
      'zh-Hant': '企業團隊離開辦公桌走進健身站',
      'zh-Hans': '企业团队离开办公桌走进健身站',
    },
    line: {
      en: 'Corporate volunteers run circuit training days alongside members.',
      'zh-Hant': '企業義工與會員一同進行循環訓練日。',
      'zh-Hans': '企业义工与会员一同进行循环训练日。',
    },
    author: 'Corporate volunteers',
    accent: 'navy',
    images: ['/brand/csr.jpg'],
    celebrateCount: 145,
    postedAt: '2026-06-19',
  },
  {
    id: 's23',
    type: 'csr',
    title: {
      en: 'Coached a full session, start to finish',
      'zh-Hant': '從頭到尾帶領了一整節活動',
      'zh-Hans': '从头到尾带领了一整节活动',
    },
    line: {
      en: 'Partner teams contribute over a thousand volunteer hours a month.',
      'zh-Hant': '合作團隊每月貢獻超過一千小時義工服務。',
      'zh-Hans': '合作团队每月贡献超过一千小时义工服务。',
    },
    author: 'Partner teams',
    accent: 'teal',
    images: ['/brand/activity.jpg'],
    celebrateCount: 117,
    postedAt: '2026-06-16',
  },
  {
    id: 's24',
    type: 'outings',
    title: {
      en: 'Crossed the harbour by ferry',
      'zh-Hant': '乘渡輪橫過維港',
      'zh-Hans': '乘渡轮横过维港',
    },
    line: {
      en: 'Outings practise the everyday travel that independence is built on.',
      'zh-Hant': '外出活動練習日常出行，這是獨立生活的基礎。',
      'zh-Hans': '外出活动练习日常出行，这是独立生活的基础。',
    },
    author: 'Community outing',
    accent: 'yellow',
    images: ['/brand/gallery.jpeg'],
    celebrateCount: 126,
    postedAt: '2026-06-13',
  },
  {
    id: 's25',
    type: 'outings',
    title: {
      en: 'Made it to the top of the trail',
      'zh-Hant': '走到了山徑的頂點',
      'zh-Hans': '走到了山径的顶点',
    },
    line: {
      en: 'The hiking group goes out whatever the Hong Kong weather is doing.',
      'zh-Hant': '遠足小組風雨不改，照樣出發。',
      'zh-Hans': '远足小组风雨不改，照样出发。',
    },
    author: 'Hiking group',
    accent: 'pink',
    images: ['/brand/hero-climb.jpg'],
    celebrateCount: 139,
    postedAt: '2026-06-10',
  },
  {
    id: 's26',
    type: 'sport',
    title: {
      en: 'Took the podium',
      'zh-Hant': '站上頒獎台',
      'zh-Hans': '站上颁奖台',
    },
    line: {
      en: 'Members compete in open competitions, not only in-house sessions.',
      'zh-Hant': '會員參與公開賽事，而不只是內部活動。',
      'zh-Hans': '会员参与公开赛事，而不只是内部活动。',
    },
    author: 'Competition squad',
    accent: 'navy',
    images: ['/brand/competition-champion.jpeg'],
    celebrateCount: 258,
    postedAt: '2026-06-07',
  },
  {
    id: 's27',
    type: 'fitness',
    title: {
      en: 'Kept pace for the whole class',
      'zh-Hant': '全程跟上整節課的節奏',
      'zh-Hans': '全程跟上整节课的节奏',
    },
    line: {
      en: 'Around 800 sessions of classes and activities run every month.',
      'zh-Hant': '每月約有 800 節課堂及活動。',
      'zh-Hans': '每月约有 800 节课堂及活动。',
    },
    author: 'Fitness class',
    accent: 'teal',
    images: ['/brand/fire.jpeg'],
    celebrateCount: 104,
    postedAt: '2026-06-04',
  },
  {
    id: 's28',
    type: 'art',
    title: {
      en: 'Sang in front of everyone',
      'zh-Hant': '在所有人面前唱歌',
      'zh-Hans': '在所有人面前唱歌',
    },
    line: {
      en: 'More than 90 types of activity run across the programme each month.',
      'zh-Hant': '每月有超過 90 種不同類型的活動。',
      'zh-Hans': '每月有超过 90 种不同类型的活动。',
    },
    author: 'Choir',
    accent: 'yellow',
    images: ['/brand/love21.jpeg'],
    celebrateCount: 112,
    postedAt: '2026-06-01',
  },
  {
    id: 's29',
    type: 'family',
    title: {
      en: 'Found the centre, and stayed',
      'zh-Hant': '找到了這個中心，然後留了下來',
      'zh-Hans': '找到了这个中心，然后留了下来',
    },
    line: {
      en: 'More than 500 families are supported through the programmes.',
      'zh-Hant': '超過 500 個家庭獲得計劃支援。',
      'zh-Hans': '超过 500 个家庭获得计划支援。',
    },
    author: 'Member families',
    accent: 'pink',
    images: ['/brand/member.jpg'],
    celebrateCount: 193,
    postedAt: '2026-05-29',
  },
  {
    id: 's30',
    type: 'special',
    title: {
      en: 'Everyone in one photograph',
      'zh-Hant': '所有人合照一張',
      'zh-Hans': '所有人合照一张',
    },
    line: {
      en: 'The whole community turns out for the annual group photo.',
      'zh-Hant': '整個社群都會出席一年一度的大合照。',
      'zh-Hans': '整个社群都会出席一年一度的大合照。',
    },
    author: 'Love 21 community',
    accent: 'navy',
    images: ['/brand/hero-group.jpg'],
    celebrateCount: 276,
    postedAt: '2026-05-26',
  },
]

export const knowledgeStats = [
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
      en: 'There’s more they take part in than most people guess',
      'zh-Hant': '他們參與的活動，比大部分人猜的還要多',
      'zh-Hans': '他们参与的活动，比大部分人猜的还要多',
    },
    body: {
      en: 'Guess how many different activities Love 21 members take part in — sport, dance, art and more — then see the real number.',
      'zh-Hant': '先猜猜 Love 21 會員參與多少種不同活動——運動、跳舞、藝術等等——再看看真實數字。',
      'zh-Hans': '先猜猜 Love 21 会员参与多少种不同活动——运动、跳舞、艺术等等——再看看真实数字。',
    },
  },
]

/**
 * Real activity descriptions, salvaged from the removed "Follow a program" panel
 * (that feature promised notifications we don't build). Earmarked for the future
 * Employment/Opportunities block — 'cafe' is the clearest real employment-ability
 * example: real shifts, real customers, real skills.
 */
export const activityAbilities = [
  {
    id: 'dragon-boat',
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
  },
  {
    id: 'dance',
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
  },
  {
    id: 'cafe',
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
  },
  {
    id: 'art-studio',
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
  },
  {
    id: 'cook-share',
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
  },
  {
    id: 'fitness-circuit',
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
  },
]

export const spotlights = [
  {
    id: 'ken',
    achievement: {
      en: 'Leads Saturday dance warm-ups.',
      'zh-Hant': '帶領週六舞蹈熱身。',
      'zh-Hans': '带领周六舞蹈热身。',
    },
    name: 'Ken',
    detail: {
      en: 'Ken counts the beats for thirty dancers every Saturday morning.',
      'zh-Hant': 'Ken 每個週六早上為三十位舞者打拍子。',
      'zh-Hans': 'Ken 每个周六早上为三十位舞者打拍子。',
    },
    category: { en: 'Coach · Dance', 'zh-Hant': '教練 · 舞蹈', 'zh-Hans': '教练 · 舞蹈' },
    accent: 'pink',
  },
  {
    id: 'mei',
    achievement: {
      en: 'Runs the CSR café morning bar.',
      'zh-Hant': '主理企業社會責任咖啡店早班吧台。',
      'zh-Hans': '主理企业社会责任咖啡店早班吧台。',
    },
    name: 'Mei',
    detail: {
      en: 'Mei hosts colleagues on Community & Education shifts and knows every regular by name.',
      'zh-Hant': 'Mei 在社區與教育當值接待同事，記得每位常客的名字。',
      'zh-Hans': 'Mei 在社区与教育当值接待同事，记得每位常客的名字。',
    },
    category: {
      en: 'Barista · Community & Education',
      'zh-Hant': '咖啡師 · 社區與教育',
      'zh-Hans': '咖啡师 · 社区与教育',
    },
    accent: 'teal',
  },
  {
    // Real event: RHKYC x Love 21 inclusive dragon-boat programme, Aug–Sep 2021.
    // No individual member is named in the public record, so this stays a team
    // credit rather than inventing a person's identity. Sources: SCMP
    // (scmp.com/news/hong-kong/society/article/3155167) and SCMP video
    // (scmp.com/video/scmp-originals/3150667).
    id: 'dragon-boat-crew',
    achievement: {
      en: 'Raced in open water after six weeks of training.',
      'zh-Hant': '六週訓練後，完成公海龍舟賽事。',
      'zh-Hans': '六周训练后，完成公海龙舟赛事。',
    },
    name: 'RHKYC × Love 21',
    detail: {
      en: 'Thirteen teens trained with the Royal Hong Kong Yacht Club for six weeks, then raced open water — chanting "friendship first, losing second."',
      'zh-Hant': '十三位青年與香港遊艇會接受六週訓練，其後在海上完成龍舟賽事——口號是「友誼第一，比賽第二」。',
      'zh-Hans': '十三位青年与香港游艇会接受六周训练，其后在海上完成龙舟赛事——口号是「友谊第一，比赛第二」。',
    },
    category: {
      en: 'Team · Dragon boat',
      'zh-Hant': '團隊 · 龍舟',
      'zh-Hans': '团队 · 龙舟',
    },
    accent: 'navy',
  },
  {
    id: 'aya',
    achievement: {
      en: 'Landed a clean bocce scoring shot.',
      'zh-Hant': '打出一記漂亮的地擲球得分。',
      'zh-Hans': '打出一记漂亮的地掷球得分。',
    },
    name: 'Aya',
    detail: {
      en: 'Aya trains bocce alongside boxing and fencing sessions with the Sports programme.',
      'zh-Hant': 'Aya 在運動項目中練習地擲球，也參與拳擊與劍擊課。',
      'zh-Hans': 'Aya 在运动项目中练习地掷球，也参与拳击与剑击课。',
    },
    category: {
      en: 'Athlete · Bocce',
      'zh-Hant': '運動員 · 地擲球',
      'zh-Hans': '运动员 · 地掷球',
    },
    accent: 'yellow',
  },
]
