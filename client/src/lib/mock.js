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
    images: ['/brand/class.jpg'],
    celebrateCount: 128,
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
    images: ['/brand/hero-huddle.jpg'],
    celebrateCount: 76,
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
    images: ['/brand/class.jpg'],
    celebrateCount: 54,
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
    images: ['/brand/hero-group.jpg'],
    celebrateCount: 91,
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
  },
  // Real: Love 21 Employment Training Programme, SCMP 8 Nov 2021 (love21foundation.com/media).
  // Roles verified from the article subhead — don't add unverified job titles.
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
    images: ['/brand/class.jpg', '/brand/hero-huddle.jpg'],
    celebrateCount: 210,
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
    images: ['/brand/hero-climb.jpg'],
    celebrateCount: 47,
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
    images: ['/brand/activity.jpg'],
    celebrateCount: 88,
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
    images: ['/brand/hero-huddle.jpg'],
    celebrateCount: 156,
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
    images: ['/brand/class.jpg'],
    celebrateCount: 39,
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
    images: ['/brand/hero-group.jpg'],
    celebrateCount: 72,
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
