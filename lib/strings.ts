export type Locale = 'en' | 'zh-Hant' | 'zh-Hans'

export const LOCALES: { code: Locale; label: string; short: string }[] = [
  { code: 'zh-Hant', label: '繁體中文', short: '繁' },
  { code: 'zh-Hans', label: '简体中文', short: '简' },
  { code: 'en', label: 'English', short: 'EN' },
]

type Strings = {
  nav: {
    home: string
    community: string
    volunteer: string
    give: string
    donate: string
    easyRead: string
    language: string
    skipToContent: string
  }
  hero: {
    eyebrow: string
    title: string
    subhead: string
    cta: string
  }
  stats: {
    title: string
    updated: string
    items: { value: number; suffix: string; label: string }[]
  }
  activities: {
    title: string
    subhead: string
    recruiting: string
    joinCta: string
    viewCta: string
  }
  spotlight: {
    title: string
    subhead: string
    reveal: string
    readMore: string
  }
  map: {
    kicker: string
    title: string
    subhead: string
  }
  paths: {
    title: string
    subhead: string
    witness: { tag: string; title: string; body: string; cta: string }
    take: { tag: string; title: string; body: string; cta: string }
    support: { tag: string; title: string; body: string; cta: string }
  }
  footer: {
    tax: string
    portal: string
    support: string
    followUs: string
    rights: string
  }
  community: {
    eyebrow: string
    title: string
    subhead: string
    filterAll: string
    filters: Record<
      | 'sport'
      | 'art'
      | 'nutrition'
      | 'family'
      | 'fitness'
      | 'special'
      | 'outings'
      | 'csr',
      string
    >
    toldBy: string
    shareCta: string
    shareTitle: string
    shareHint: string
    sharePhoto: string
    shareLine: string
    shareLinePlaceholder: string
    shareAiLabel: string
    shareAiDraft: string
    shareReviewNote: string
    shareSubmit: string
    shareClose: string
    shareSent: string
    followTitle: string
    followSubhead: string
    followCta: string
    followingCta: string
    followNotify: string
    knowledgeHook: string
    dotsCaption: string
    sliderGuess: string
    sliderReveal: string
    sliderYourGuess: string
    sliderReal: string
    emptyFilter: string
  }
}

export const STRINGS: Record<Locale, Strings> = {
  en: {
    nav: {
      home: 'Home',
      community: 'Community',
      volunteer: 'Volunteer',
      give: 'Give',
      donate: 'Donate',
      easyRead: 'Easy Read',
      language: 'Language',
      skipToContent: 'Skip to content',
    },
    hero: {
      eyebrow: 'Love 21 Foundation · Hong Kong',
      title: 'So much ability.',
      subhead:
        'We celebrate what people with Down syndrome, autism and other neurodiversity can do.',
      cta: 'See what they can do',
    },
    stats: {
      title: 'Ability, happening right now',
      updated: 'Last updated 30s ago · live from our activity log',
      items: [
        { value: 900, suffix: '+', label: 'activities / month' },
        { value: 680, suffix: '', label: 'families' },
        { value: 90, suffix: '+', label: 'activity types' },
        { value: 10, suffix: '', label: 'years' },
      ],
    },
    activities: {
      title: 'Coming up',
      subhead: 'Join an activity, or come along to cheer.',
      recruiting: 'Volunteers welcome',
      joinCta: 'Join as a volunteer',
      viewCta: 'View activity',
    },
    spotlight: {
      title: 'Ability spotlight',
      subhead: 'Every achievement here is real.',
      reveal: 'Meet',
      readMore: 'Read the story',
    },
    map: {
      kicker: 'Across Hong Kong',
      title: 'Where we gather',
      subhead: 'Our activities run in neighbourhoods all over the city.',
    },
    paths: {
      title: 'Three ways in',
      subhead: 'Pick where you want to start.',
      witness: {
        tag: 'Witness',
        title: 'See the community',
        body: 'Meet the people and the moments that show what ability looks like.',
        cta: 'Explore Community',
      },
      take: {
        tag: 'Take part',
        title: 'Volunteer with us',
        body: 'Bring your time and skills to an activity that fits you.',
        cta: 'Start volunteering',
      },
      support: {
        tag: 'Support',
        title: 'Give with meaning',
        body: 'Your gift funds real activities you can see on this page.',
        cta: 'Give today',
      },
    },
    footer: {
      tax: 'Love 21 Foundation is a registered charity in Hong Kong. Donations of HK$100 or more are tax-deductible under Section 88.',
      portal: 'Member portal',
      support: 'Get support',
      followUs: 'Follow us',
      rights: 'All rights reserved.',
    },
    community: {
      eyebrow: 'Community · proof & learning',
      title: 'Ability, already large.',
      subhead:
        'Real moments from our members — and the facts that show why this work matters. There is no separate Learn page; the community is the classroom.',
      filterAll: 'All',
      filters: {
        sport: 'Sport',
        art: 'Art / Music / Dance',
        nutrition: 'Nutrition',
        family: 'Family',
        fitness: 'Fitness',
        special: 'Special Events',
        outings: 'Outings',
        csr: 'CSR',
      },
      toldBy: 'Told by',
      shareCta: 'Share a moment',
      shareTitle: 'Share a moment',
      shareHint: 'A coach or family posts a photo and one line. AI drafts the full post.',
      sharePhoto: 'Photo',
      shareLine: 'One line',
      shareLinePlaceholder: 'e.g. Finished the race with the whole crew',
      shareAiLabel: 'AI draft preview',
      shareAiDraft:
        'Today our member showed quiet courage on the water — paddling every stroke with the crew, finishing strong, and teaching us again what ability looks like in motion.',
      shareReviewNote: 'Posts require review before going public. This is a UI preview only.',
      shareSubmit: 'Submit for review',
      shareClose: 'Close',
      shareSent: 'Submitted for review — thank you.',
      followTitle: 'Follow a program',
      followSubhead: 'Follow an activity type — not a person. New moments notify you.',
      followCta: 'Follow',
      followingCta: 'Following',
      followNotify: 'You’ll hear when new moments land in this program.',
      knowledgeHook: 'Want to change this number? → Volunteer',
      dotsCaption: '700 babies · 1 lit',
      sliderGuess: 'Drag to guess the percentage',
      sliderReveal: 'Reveal the real figure',
      sliderYourGuess: 'Your guess',
      sliderReal: 'The real figure',
      emptyFilter: 'No moments in this program yet — try another filter.',
    },
  },
  'zh-Hant': {
    nav: {
      home: '首頁',
      community: '社群',
      volunteer: '義工',
      give: '捐助',
      donate: '捐款',
      easyRead: '簡易閱讀',
      language: '語言',
      skipToContent: '跳至內容',
    },
    hero: {
      eyebrow: 'Love 21 Foundation · 香港',
      title: '無限能力。',
      subhead: '我們慶祝唐氏綜合症、自閉症及其他神經多樣性人士的能力。',
      cta: '看看他們的能力',
    },
    stats: {
      title: '此刻正在發生的能力',
      updated: '30 秒前更新 · 來自我們的活動紀錄',
      items: [
        { value: 900, suffix: '+', label: '每月活動' },
        { value: 680, suffix: '', label: '個家庭' },
        { value: 90, suffix: '+', label: '活動類型' },
        { value: 10, suffix: '', label: '年' },
      ],
    },
    activities: {
      title: '即將舉行',
      subhead: '參加活動，或前來打氣。',
      recruiting: '歡迎義工',
      joinCta: '成為義工',
      viewCta: '查看活動',
    },
    spotlight: {
      title: '能力聚焦',
      subhead: '這裡每一項成就都是真實的。',
      reveal: '認識',
      readMore: '閱讀故事',
    },
    map: {
      kicker: '遍佈香港',
      title: '我們的聚腳點',
      subhead: '我們的活動遍佈全港各區。',
    },
    paths: {
      title: '三種參與方式',
      subhead: '選擇你想開始的地方。',
      witness: {
        tag: '見證',
        title: '認識社群',
        body: '認識展現能力的人和時刻。',
        cta: '探索社群',
      },
      take: {
        tag: '參與',
        title: '成為義工',
        body: '把你的時間和才能帶到適合你的活動。',
        cta: '開始做義工',
      },
      support: {
        tag: '支持',
        title: '有意義的捐助',
        body: '你的捐款資助你在此頁看到的真實活動。',
        cta: '立即捐助',
      },
    },
    footer: {
      tax: 'Love 21 Foundation 為香港註冊慈善機構。捐款港幣 100 元或以上可根據第 88 條申請扣稅。',
      portal: '會員專區',
      support: '尋求支援',
      followUs: '關注我們',
      rights: '版權所有。',
    },
    community: {
      eyebrow: '社群 · 實證與認識',
      title: '能力，早已盛大。',
      subhead:
        '學員的真實時刻——以及說明這份工作為何重要的事實。沒有獨立的「認識」頁；社群本身就是課堂。',
      filterAll: '全部',
      filters: {
        sport: '運動',
        art: '藝術／音樂／舞蹈',
        nutrition: '營養',
        family: '家庭',
        fitness: '體能',
        special: '特別活動',
        outings: '外出',
        csr: '企業社會責任',
      },
      toldBy: '講述者',
      shareCta: '分享一個時刻',
      shareTitle: '分享一個時刻',
      shareHint: '教練或家人貼上照片與一句話，AI 會起草完整貼文。',
      sharePhoto: '照片',
      shareLine: '一句話',
      shareLinePlaceholder: '例如：與全隊一起完成比賽',
      shareAiLabel: 'AI 草稿預覽',
      shareAiDraft:
        '今天我們的學員在水上展現沉著勇氣——每一槳都與隊友同行，穩穩抵達終點，再次教我們看見動態中的能力。',
      shareReviewNote: '貼文須經審核才會公開。此為介面預覽。',
      shareSubmit: '提交審核',
      shareClose: '關閉',
      shareSent: '已提交審核——謝謝。',
      followTitle: '追蹤一個項目',
      followSubhead: '追蹤活動類型——不是個人。有新時刻會通知你。',
      followCta: '追蹤',
      followingCta: '追蹤中',
      followNotify: '此項目有新時刻時會通知你。',
      knowledgeHook: '想改變這個數字？→ 做義工',
      dotsCaption: '700 名嬰兒 · 點亮 1 個',
      sliderGuess: '拖動猜測百分比',
      sliderReveal: '顯示真實數字',
      sliderYourGuess: '你的猜測',
      sliderReal: '真實數字',
      emptyFilter: '此項目暫無時刻——試試其他篩選。',
    },
  },
  'zh-Hans': {
    nav: {
      home: '首页',
      community: '社群',
      volunteer: '义工',
      give: '捐助',
      donate: '捐款',
      easyRead: '简易阅读',
      language: '语言',
      skipToContent: '跳至内容',
    },
    hero: {
      eyebrow: 'Love 21 Foundation · 香港',
      title: '无限能力。',
      subhead: '我们庆祝唐氏综合症、自闭症及其他神经多样性人士的能力。',
      cta: '看看他们的能力',
    },
    stats: {
      title: '此刻正在发生的能力',
      updated: '30 秒前更新 · 来自我们的活动记录',
      items: [
        { value: 900, suffix: '+', label: '每月活动' },
        { value: 680, suffix: '', label: '个家庭' },
        { value: 90, suffix: '+', label: '活动类型' },
        { value: 10, suffix: '', label: '年' },
      ],
    },
    activities: {
      title: '即将举行',
      subhead: '参加活动，或前来加油。',
      recruiting: '欢迎义工',
      joinCta: '成为义工',
      viewCta: '查看活动',
    },
    spotlight: {
      title: '能力聚焦',
      subhead: '这里每一项成就都是真实的。',
      reveal: '认识',
      readMore: '阅读故事',
    },
    paths: {
      title: '三种参与方式',
      subhead: '选择你想开始的地方。',
      witness: {
        tag: '见证',
        title: '认识社群',
        body: '认识展现能力的人和时刻。',
        cta: '探索社群',
      },
      take: {
        tag: '参与',
        title: '成为义工',
        body: '把你的时间和才能带到适合你的活动。',
        cta: '开始做义工',
      },
      support: {
        tag: '支持',
        title: '有意义的捐助',
        body: '你的捐款资助你在此页看到的真实活动。',
        cta: '立即捐助',
      },
    },
    footer: {
      tax: 'Love 21 Foundation 为香港注册慈善机构。捐款港币 100 元或以上可根据第 88 条申请扣税。',
      portal: '会员专区',
      support: '寻求支援',
      followUs: '关注我们',
      rights: '版权所有。',
    },
    community: {
      eyebrow: '社群 · 实证与认识',
      title: '能力，早已盛大。',
      subhead:
        '学员的真实时刻——以及说明这份工作为何重要的事实。没有独立的「认识」页；社群本身就是课堂。',
      filterAll: '全部',
      filters: {
        sport: '运动',
        art: '艺术／音乐／舞蹈',
        nutrition: '营养',
        family: '家庭',
        fitness: '体能',
        special: '特别活动',
        outings: '外出',
        csr: '企业社会责任',
      },
      toldBy: '讲述者',
      shareCta: '分享一个时刻',
      shareTitle: '分享一个时刻',
      shareHint: '教练或家人贴上照片与一句话，AI 会起草完整贴文。',
      sharePhoto: '照片',
      shareLine: '一句话',
      shareLinePlaceholder: '例如：与全队一起完成比赛',
      shareAiLabel: 'AI 草稿预览',
      shareAiDraft:
        '今天我们的学员在水上展现沉着勇气——每一桨都与队友同行，稳稳抵达终点，再次教我们看见动态中的能力。',
      shareReviewNote: '贴文须经审核才会公开。此为界面预览。',
      shareSubmit: '提交审核',
      shareClose: '关闭',
      shareSent: '已提交审核——谢谢。',
      followTitle: '追踪一个项目',
      followSubhead: '追踪活动类型——不是个人。有新时刻会通知你。',
      followCta: '追踪',
      followingCta: '追踪中',
      followNotify: '此项目有新时刻时会通知你。',
      knowledgeHook: '想改变这个数字？→ 做义工',
      dotsCaption: '700 名婴儿 · 点亮 1 个',
      sliderGuess: '拖动猜测百分比',
      sliderReveal: '显示真实数字',
      sliderYourGuess: '你的猜测',
      sliderReal: '真实数字',
      emptyFilter: '此项目暂无时刻——试试其他筛选。',
    },
  },
}
