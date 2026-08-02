/** Migrated Home content from About (bilingual). Locale keys: en | zh-Hant | zh-Hans */

export const HOME_SECTION_NAV = [
  { id: 'impact', en: 'Impact', 'zh-Hant': '影響力', 'zh-Hans': '影响力' },
  { id: 'stories', en: 'Stories', 'zh-Hant': '故事', 'zh-Hans': '故事' },
  { id: 'programmes', en: 'Programmes', 'zh-Hant': '活動', 'zh-Hans': '活动' },
  { id: 'leadership', en: 'Leadership', 'zh-Hant': '領導團隊', 'zh-Hans': '领导团队' },
  { id: 'support', en: 'Support', 'zh-Hant': '支持我們', 'zh-Hans': '支持我们' },
]

/** Real PDFs from love21foundation.com/our-finance/ (EN reports page). First entry = latest. */
export const ANNUAL_REPORT = {
  title: {
    en: 'Annual Report',
    'zh-Hant': '年度報告',
    'zh-Hans': '年度报告',
  },
  /** Two paragraphs rendered separately in AnnualReportBar. */
  body: [
    {
      en: 'Read through our reports to know more about our work.',
      'zh-Hant': '細閱我們的報告，了解更多我們的工作。',
      'zh-Hans': '细阅我们的报告，了解更多我们的工作。',
    },
    {
      en: 'Every year we publish a detailed Annual Report documenting the programmes and impact made possible thanks to our supporters. Transparency matters to us — we openly share our annual financial statements for anyone to review.',
      'zh-Hant': '我們每年出版詳盡的年度報告，記錄在支持者協助下得以實現的活動與影響力。我們重視財務透明，年度財務報表公開供各界查閱。',
      'zh-Hans': '我们每年出版详尽的年度报告，记录在支持者协助下得以实现的活动与影响力。我们重视财务透明，年度财务报表公开供各界查阅。',
    },
  ],
  primaryCta: {
    en: 'Download 2024/25 PDF',
    'zh-Hant': '下載 2024/25 PDF',
    'zh-Hans': '下载 2024/25 PDF',
  },
  priorLabel: {
    en: 'Earlier years',
    'zh-Hant': '往年',
    'zh-Hans': '往年',
  },
  downloads: [
    {
      year: '2024/25',
      href: 'https://love21foundation.com/wp-content/uploads/2026/04/Annualreport_final.pdf',
    },
    {
      year: '2023/24',
      href: 'https://love21foundation.com/wp-content/uploads/2025/10/Love21-ANNUAL-REPORT_2324.pdf',
    },
    {
      year: '2022/23',
      href: 'https://love21foundation.com/wp-content/uploads/2024/03/Love-21-Annual-Report-2022-2023-ENG-3.pdf',
    },
  ],
}

export const MEMBER_ACHIEVEMENTS = [
  {
    icon: 'medal',
    title: {
      en: 'Asian Para-Karate Championships',
      'zh-Hant': '亞洲殘疾人空手道錦標賽',
      'zh-Hans': '亚洲残疾人空手道锦标赛',
    },
    body: {
      en: 'Medals won by our members on the regional stage.',
      'zh-Hant': '會員在區域賽事中奪得獎牌。',
      'zh-Hans': '会员在区域赛事中夺得奖牌。',
    },
    stat: { en: '5 Medals Won', 'zh-Hant': '奪得 5 面獎牌', 'zh-Hans': '夺得 5 面奖牌' },
    image: '/brand/karate.jpeg',
    link: 'https://www.facebook.com/share/p/1D3rjLeYs1/?mibextid=WC7FNe',
  },
  {
    icon: 'utensils',
    title: {
      en: 'Beyond Limits Charity Banquet',
      'zh-Hant': '「Beyond Limits」慈善晚宴',
      'zh-Hans': '「Beyond Limits」慈善晚宴',
    },
    body: {
      en: 'From radiant smiles to breathtaking performances, every moment captured the true power of inclusion.',
      'zh-Hant': '從自信笑容到震撼表演，每一刻都展現了共融的力量。',
      'zh-Hans': '从自信笑容到震撼表演，每一刻都展现了共融的力量。',
    },
    stat: { en: 'Sold Out Event', 'zh-Hant': '全場爆滿', 'zh-Hans': '全场爆满' },
    image: '/brand/beyond-limit.jpeg',
    link: 'https://www.facebook.com/share/p/182shByRE7/?mibextid=WC7FNe',
  },
  {
    icon: 'trophy',
    title: {
      en: 'Special Ability Competition Champions',
      'zh-Hant': '特殊展能比賽橫掃獎項',
      'zh-Hans': '特殊展能比赛横扫奖项',
    },
    body: {
      en: 'Our stars shone bright, bringing home a long list of awards.',
      'zh-Hant': '成員才華大爆發，橫掃多個獎項。',
      'zh-Hans': '成员才华大爆发，横扫多个奖项。',
    },
    stat: { en: 'Multiple Awards', 'zh-Hant': '多項大獎', 'zh-Hans': '多项大奖' },
    image: '/brand/competition-champion.jpeg',
    link: 'https://www.facebook.com/share/p/19z9qGodFS/?mibextid=WC7FNe',
  },
  {
    icon: 'ship',
    title: { en: 'Dragon Boat Debut', 'zh-Hant': '龍舟首秀', 'zh-Hans': '龙舟首秀' },
    body: {
      en: 'Members completed a six-week training programme before racing together in open water for the first time.',
      'zh-Hant': '會員完成六週訓練課程後，首次於公開水域一同參賽。',
      'zh-Hans': '会员完成六周训练课程后，首次于公开水域一同参赛。',
    },
    stat: { en: '6 Week Training', 'zh-Hant': '六週訓練', 'zh-Hans': '六周训练' },
    image: '/brand/dragonboat.jpeg',
    link: 'https://www.facebook.com/share/p/1BhrqFgJtQ/?mibextid=WC7FNe',
  },
]

export const STORY_MILESTONES = [
  {
    year: '2017',
    title: {
      en: 'A simple question starts a movement.',
      'zh-Hant': '一個簡單問題，開啟一場行動。',
      'zh-Hans': '一个简单问题，开启一场行动。',
    },
    body: {
      en: 'Love 21 Foundation is founded by Jeff Rotmeyer, alongside our sister charity ImpactHK.',
      'zh-Hant': 'Jeff Rotmeyer 創立 Love 21 基金會，並與姊妹慈善機構 ImpactHK 同行。',
      'zh-Hans': 'Jeff Rotmeyer 创立 Love 21 基金会，并与姊妹慈善机构 ImpactHK 同行。',
    },
    image: '/brand/love21.jpeg',
  },
  {
    year: '2021',
    title: {
      en: 'Wellbeing becomes a whole-family journey.',
      'zh-Hant': '健康成為全家人的旅程。',
      'zh-Hans': '健康成为全家人的旅程。',
    },
    body: {
      en: 'We launch comprehensive one-on-one nutrition support alongside our sports classes.',
      'zh-Hant': '我們在運動課程以外推出全面的一對一營養支援。',
      'zh-Hans': '我们在运动课程以外推出全面的一对一营养支援。',
    },
    image: '/brand/nutritionprog.jpeg',
  },
  {
    year: '2023',
    title: {
      en: 'Our community helps us rebuild.',
      'zh-Hant': '社群攜手協助我們重建。',
      'zh-Hans': '社群携手协助我们重建。',
    },
    body: {
      en: 'After a fire damages our original San Po Kong centre, Hong Kong comes together. We reopen in October with expanded capacity.',
      'zh-Hant': '新蒲崗原有中心因火災受損後，香港社群攜手支持我們。我們於十月重新開幕，服務容量大幅提升。',
      'zh-Hans': '新蒲岗原有中心因火灾受损后，香港社群携手支持我们。我们于十月重新开幕，服务容量大幅提升。',
    },
    image: '/brand/fire.jpeg',
  },
  {
    year: '2025',
    title: {
      en: 'Growing to meet the need.',
      'zh-Hant': '成長以回應需要。',
      'zh-Hans': '成长以回应需要。',
    },
    body: {
      en: 'Our first-ever Charity Raffle launches to meet growing demand for our services.',
      'zh-Hant': '我們首次推出慈善抽獎活動，以回應日益增加的服務需求。',
      'zh-Hans': '我们首次推出慈善抽奖活动，以回应日益增加的服务需求。',
    },
    image: '/brand/charityraffle.jpeg',
  },
  {
    year: '2026',
    title: {
      en: 'Beyond limits, together.',
      'zh-Hant': '攜手超越界限。',
      'zh-Hans': '携手超越界限。',
    },
    body: {
      en: 'On 12 June, our Beyond Limits Banquet brought supporters together for member performances — raising funds for fitness, ABA therapy, and counselling sessions.',
      'zh-Hant': '6 月 12 日，Beyond Limits 晚宴匯聚支持者，欣賞會員表演，並為健身、ABA 治療及輔導服務籌款。',
      'zh-Hans': '6 月 12 日，Beyond Limits 晚宴汇聚支持者，欣赏会员表演，并为健身、ABA 治疗及辅导服务筹款。',
    },
    image: '/brand/beyondlimit.jpeg',
  },
]

export const BOARD = [
  { name: 'Carol Chan', image: '/brand/empty.png' },
  { name: 'Eleni Symeonidou', image: '/brand/eleni symeonidou.jpeg' },
  { name: 'Jeff Sayed', image: '/brand/jeff-sayed.jpg' },
  { name: 'Matthew Hosford', image: '/brand/matthew hosford.jpg' },
  { name: 'Kevin Wong', image: '/brand/empty.png' },
  { name: 'Young-Sook Stewart', image: '/brand/Youn-Sook-Stewart.jpeg' },
  { name: 'Lobo Cheung', image: '/brand/lobo cheung.jpeg' },
  { name: 'Dan Maley', image: '/brand/dan maley.jpg' },
  { name: 'Edith Chen', image: '/brand/Edith-Chen.jpeg' },
  { name: 'James Barrett', image: '/brand/James-Barrett.jpeg', position: 'object-top' },
  { name: 'Raymond Tam', image: '/brand/raymond tam.jpeg' },
  { name: 'Dr. Ruby Ng', image: '/brand/empty.png' },
]

export const PROGRAMME_CARDS = [
  {
    id: 'sports',
    title: { en: 'Sports', 'zh-Hant': '運動', 'zh-Hans': '运动' },
    paragraphs: [
      {
        en: 'Our sports programme is designed without limitations. We aim to give our beneficiaries the greatest opportunity to reach their full potential by offering a comprehensive range of activities while also striving for excellence in each sport.',
        'zh-Hant':
          '我們的運動計劃不受限制。我們希望透過多元活動，並在每項運動中追求卓越，讓受惠者盡展潛能。',
        'zh-Hans':
          '我们的运动计划不受限制。我们希望透过多元活动，并在每项运动中追求卓越，让受惠者尽展潜能。',
      },
      {
        en: 'In addition to sport classes, we also focus on strength training, coordination and mental health activities.',
        'zh-Hant': '除運動課外，我們亦著重肌力訓練、協調能力及精神健康活動。',
        'zh-Hans': '除运动课外，我们亦着重肌力训练、协调能力及精神健康活动。',
      },
    ],
    href: '/volunteer',
    cta: { en: 'Join a session', 'zh-Hant': '參加課堂', 'zh-Hans': '参加课堂' },
  },
  {
    id: 'nutrition',
    title: { en: 'Nutrition', 'zh-Hant': '營養', 'zh-Hans': '营养' },
    paragraphs: [
      {
        en: 'Sport classes alone are not enough to significantly extend the life expectancy of our beneficiaries. This is why we’ve developed a well thought out nutrition programme to help our community, giving them the support and guidance they need to make significant healthy lifestyle changes.',
        'zh-Hant':
          '單靠運動課並不足以顯著延長受惠者的預期壽命。因此我們設計了完善的營養計劃，為社群提供所需支援與指導，協助他們作出重大健康生活轉變。',
        'zh-Hans':
          '单靠运动课并不足以显著延长受惠者的预期寿命。因此我们设计了完善的营养计划，为社群提供所需支援与指导，协助他们作出重大健康生活转变。',
      },
      {
        en: 'We also run regular cooking and food prep lessons to teach our families how to prepare these meals nutritiously and easily.',
        'zh-Hant': '我們亦定期舉辦烹飪與備餐課堂，教導家庭如何以營養又簡易的方式準備餐膳。',
        'zh-Hans': '我们亦定期举办烹饪与备餐课堂，教导家庭如何以营养又简易的方式准备餐膳。',
      },
    ],
    href: '/volunteer',
    cta: { en: 'Join a session', 'zh-Hant': '參加課堂', 'zh-Hans': '参加课堂' },
  },
  {
    id: 'family',
    title: { en: 'Family', 'zh-Hant': '家庭', 'zh-Hans': '家庭' },
    paragraphs: [
      {
        en: 'Love 21’s focus on family sets us apart. Our parent beneficiaries play a huge role in our classes and out. Family support and care for their kids is uplifting and as a charity we do all we can to support them as well as their children.',
        'zh-Hant':
          'Love 21 對家庭的重視使我們與眾不同。家長受惠者在課堂內外都扮演重要角色。家庭對孩子的支持與關愛令人振奮，作為慈善機構，我們會盡力同時支援家長與孩子。',
        'zh-Hans':
          'Love 21 对家庭的重视使我们与众不同。家长受惠者在课堂内外都扮演重要角色。家庭对孩子的支持与关爱令人振奋，作为慈善机构，我们会尽力同时支援家长与孩子。',
      },
      {
        en: 'We offer specialty classes for parents only and also allow parental participation in a large number of our sport and healthy lifestyle classes.',
        'zh-Hant': '我們提供專為家長而設的課堂，亦讓家長參與大部分運動及健康生活課堂。',
        'zh-Hans': '我们提供专为家长而设的课堂，亦让家长参与大部分运动及健康生活课堂。',
      },
    ],
    href: '/support',
    cta: { en: 'Ask for help', 'zh-Hant': '尋求支援', 'zh-Hans': '寻求支援' },
  },
  {
    id: 'csr',
    title: { en: 'CSR', 'zh-Hant': '企業社會責任', 'zh-Hans': '企业社会责任' },
    paragraphs: [
      {
        en: 'Our Corporate Social Responsibility Programme is an extremely important one for Hong Kong. Reason being that our beneficiaries, the Down syndrome and autistic community, are rarely seen and often misunderstood.',
        'zh-Hant':
          '我們的企業社會責任計劃對香港極為重要。因為我們的受惠者——唐氏綜合症及自閉症社群——甚少被看見，亦經常被誤解。',
        'zh-Hans':
          '我们的企业社会责任计划对香港极为重要。因为我们的受惠者——唐氏综合症及自闭症社群——甚少被看见，亦经常被误解。',
      },
      {
        en: 'Your employees will not only learn about our beneficiary’s amazing ability in sport, but also about their greatest ability in bringing the best out of people.',
        'zh-Hant':
          '貴公司員工不但會認識受惠者在運動上的出色能力，更能體會他們啟發他人發揮所長的最大力量。',
        'zh-Hans':
          '贵公司员工不但会认识受惠者在运动上的出色能力，更能体会他们启发他人发挥所长的最大力量。',
      },
    ],
    href: '/give',
    cta: {
      en: 'Contact us about CSR',
      'zh-Hant': '查詢 CSR 計劃',
      'zh-Hans': '查询 CSR 计划',
    },
  },
]

export const PARTNER_QUOTE_EXTRA = [
  {
    quote: {
      en: 'Our experience with Love 21 has been amazing. We first met with Jeff and Carmel, who explained the challenges that this community face, before assisting in a circuit training lesson where each of us took a fitness station to help the community stay active through different simple exercises. It was an incredible experience and one that will stay with us for a long time, really happy to have helped an organisation with such a great cause!',
      'zh-Hant':
        '我們在 Love 21 的體驗非常難忘。我們先與 Jeff 和 Carmel 見面，了解這個社群面對的挑戰，其後協助一堂循環訓練——每人負責一個健身站，透過簡單運動幫助社群保持活躍。這是一次令人難以置信的經歷，會長久留在我們心中；很高興能協助一個有如此美好使命的機構！',
      'zh-Hans':
        '我们在 Love 21 的体验非常难忘。我们先与 Jeff 和 Carmel 见面，了解这个社群面对的挑战，其后协助一堂循环训练——每人负责一个健身站，透过简单运动帮助社群保持活跃。这是一次令人难以置信的经历，会长久留在我们心中；很高兴能协助一个有如此美好使命的机构！',
    },
    by: 'Chaim — Argyll Scott',
  },
  {
    quote: {
      en: 'Volunteering at Love 21 was an eye-opening experience for us, with some delightful members and a cool space! We loved the different activities and a chance to be involved with such an amazing community.',
      'zh-Hant':
        '在 Love 21 做義工對我們來說是大開眼界的體驗——會員令人喜愛，空間也很棒！我們喜歡各種活動，也很珍惜參與這個精彩社群的機會。',
      'zh-Hans':
        '在 Love 21 做志愿者对我们来说是大开眼界的体验——会员令人喜爱，空间也很棒！我们喜欢各种活动，也很珍惜参与这个精彩社群的机会。',
    },
    by: 'Laura — Nakama Global',
  },
]

export function pickLocale(map, locale) {
  if (!map) return ''
  if (map[locale]) return map[locale]
  if (locale === 'zh-Hans' && map['zh-Hant']) return map['zh-Hant']
  return map.en ?? ''
}
