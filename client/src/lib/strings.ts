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
    about: string
    news: string
    volunteer: string
    give: string
    donate: string
    login: string
    easyRead: string
    language: string
    skipToContent: string
  }
  hero: {
    eyebrow: string
    line1: string
    line2: string
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
  volunteer: {
    kicker: string
    title: string
    subhead: string
    communityLink: string
    demoMatch: string
    modeTitle: string
    individualTag: string
    individualTitle: string
    individualBody: string
    individualCta: string
    corporateTag: string
    corporateTitle: string
    corporateBody: string
    corporateCta: string
    skillsTitle: string
    skillsHint: string
    skills: Record<
      | 'patient'
      | 'sports'
      | 'music'
      | 'kitchen'
      | 'photography'
      | 'youth14'
      | 'cantonese',
      string
    >
    clearSkills: string
    listTitle: string
    emptyList: string
    recruiting: string
    spots: string
    sourceLove21: string
    sourceHandson: string
    viewDetail: string
    backToHub: string
    detailWhat: string
    detailEligibility: string
    detailSafeguard: string
    handsonCapacity: string
    registerInterest: string
    completeHandson: string
    joinSession: string
    formIntro: string
    interestChineseName: string
    interestEnglishName: string
    interestAgeGroup: string
    ageGroups: Record<'age14_15' | 'age16_17' | 'age18', string>
    interestGender: string
    genders: Record<'female' | 'male' | 'prefer_not', string>
    interestEmail: string
    interestPhone: string
    interestRoles: string
    roles: Record<'assistant' | 'host' | 'event' | 'other', string>
    interestRoleOther: string
    interestAbout: string
    interestDiscovery: string
    discovery: Record<'existing' | 'social' | 'edm' | 'company' | 'other', string>
    interestDiscoveryOther: string
    interestSubmit: string
    interestCancel: string
    hubSignupTitle: string
    hubSignupSubhead: string
    hubSignupCta: string
    joinConfirmTitle: string
    joinConfirmBody: string
    joinConfirmYes: string
    joinConfirmNo: string
    successTitle: string
    successBody: string
    successGiveCta: string
    successHome: string
    corporatePanelTitle: string
    corporateBullets: string[]
    corporateFormTitle: string
    corporateOrg: string
    corporateContact: string
    corporateEmail: string
    corporateMessage: string
    corporateSubmit: string
    corporateThanks: string
    changeMode: string
  }
  give: {
    kicker: string
    title: string
    subhead: string
    demoBanner: string
    tabMoney: string
    tabWishlist: string
    tabFundraise: string
    amountLabel: string
    customAmountLabel: string
    customAmountHint: string
    everyDollarCounts: string
    impactLabel: string
    impactSmall: string
    once: string
    weekly: string
    monthly: string
    programmeLabel: string
    receiptNote: string
    otherMeansTitle: string
    otherMeansBank: string
    otherMeansCheque: string
    otherMeansAddress: string
    programmes: Record<
      'sports' | 'fitness' | 'nutrition' | 'family' | 'where_needed',
      string
    >
    section88: string
    trustStrip: string
    emailLabel: string
    emailHint: string
    donateCta: string
    wishlistTitle: string
    wishlistSubhead: string
    needed: string
    pledged: string
    pledgeCta: string
    pledgeTitle: string
    pledgeQty: string
    pledgeNote: string
    pledgeSubmit: string
    pledgeSuccess: string
    pledgeClose: string
    wishlistEmpty: string
    fundraiseTitle: string
    fundraiseSubhead: string
    fundraiseSteps: string[]
    fundraisePendingNote: string
    createCampaignCta: string
    yourCampaigns: string
    noCampaigns: string
    formTitle: string
    formStory: string
    formGoal: string
    formCover: string
    formEnd: string
    formSubmit: string
    campaignProgress: string
    campaignShare: string
    campaignShareDone: string
    campaignDonate: string
    campaignPending: string
    campaignNotFound: string
    stickyDonate: string
    thanksAck: string
    thanksNotifyLabel: string
    thanksNotifyHelper: string
    thanksEmail: string
    thanksNotifyToast: string
    thanksSampleUpdate: string
    thanksCreateAccount: string
    thanksCreateAccountBody: string
    thanksCreateCta: string
    thanksNoThanks: string
    thanksExistingBody: string
    thanksViewGiving: string
    thanksVolunteer: string
    thanksShareCampaign: string
    thanksHome: string
  }
}

export const STRINGS: Record<Locale, Strings> = {
  en: {
    nav: {
      home: 'Home',
      community: 'Community',
      about: 'About',
      news: 'News',
      volunteer: 'Volunteer',
      give: 'Give',
      donate: 'Donate',
      login: 'Log in',
      easyRead: 'Easy Read',
      language: 'Language',
      skipToContent: 'Skip to content',
    },
    hero: {
      eyebrow: '#Somuchability',
      line1: 'So much',
      line2: 'ability',
      subhead:
        'Sport, nutrition and family care programmes — free for our members.',
      cta: 'See what they can do',
    },
    stats: {
      title: 'Impact you can count',
      updated: 'Last updated 30s ago · Annual Report 2024/25',
      items: [
        { value: 6859, suffix: '', label: 'sessions offered (2024/25)' },
        { value: 490, suffix: '', label: 'families supported' },
        { value: 84, suffix: '', label: 'activity types' },
        { value: 1000, suffix: '+', label: 'volunteer hours / month' },
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
volunteer: {
      kicker: 'Take part',
      title: 'Show up. Meet them.',
      subhead:
        'Stigma shrinks face to face. Pick a session, bring your energy, and take part — not from the sidelines.',
      communityLink: 'See the community first',
      demoMatch: 'DEMO-ONLY — skill filters are local fixtures, not live AI matching.',
      modeTitle: 'How do you want to take part?',
      individualTag: 'Individual',
      individualTitle: 'Book or assist a class',
      individualBody: 'Join one session as an active participant. HandsOn listings and Love 21 sessions, in one place.',
      individualCta: 'Browse sessions',
      corporateTag: 'Corporate',
      corporateTitle: 'CSR sessions + giving',
      corporateBody: 'Group volunteering — drumming, Zumba, cooking, art. Contact us; we plan together.',
      corporateCta: 'Contact for CSR',
      skillsTitle: 'What can you bring?',
      skillsHint: 'Optional — tap to filter. DEMO-ONLY matching.',
      skills: {
        patient: 'Patient',
        sports: 'Sports',
        music: 'Music',
        kitchen: 'Kitchen',
        photography: 'Photography',
        youth14: 'Youth 14+',
        cantonese: 'Cantonese optional',
      },
      clearSkills: 'Clear filters',
      listTitle: 'Open sessions',
      emptyList: 'No sessions match those skills — try clearing a filter.',
      recruiting: 'Recruiting',
      spots: '{filled}/{capacity} spots',
      sourceLove21: 'Love 21',
      sourceHandson: 'HandsOn',
      viewDetail: 'View session',
      backToHub: 'All sessions',
      detailWhat: 'What you’ll actually do',
      detailEligibility: 'Who can join',
      detailSafeguard:
        'Safeguarding: coaches are on site. We may ask for a brief introduction before your first session — we are still finalising the full process with Love 21.',
      handsonCapacity:
        'HandsOn: {filled}/{capacity} booked · {interested} interested here',
      registerInterest: 'Register interest',
      completeHandson: 'Complete booking on HandsOn',
      joinSession: 'Join session',
      formIntro:
        'Love 21 is looking for passionate volunteers to join sports, nutrition and holistic programmes for our Down syndrome, autistic and neurodiverse community.',
      interestChineseName: 'Chinese full name',
      interestEnglishName: 'English full name',
      interestAgeGroup: 'Age group',
      ageGroups: {
        age14_15: '14–15 years old',
        age16_17: '16–17 years old',
        age18: '18 or above',
      },
      interestGender: 'Gender',
      genders: {
        female: 'Female',
        male: 'Male',
        prefer_not: 'Prefer not to say',
      },
      interestEmail: 'Email',
      interestPhone: 'Contact number',
      interestRoles: 'Which role would you like to apply for? (select all that apply)',
      roles: {
        assistant: "I'd like to be an assistant of an existing class",
        host: "I'd like to host / lead a new class for members",
        event: "I'd like to support as an event helper",
        other: 'Other',
      },
      interestRoleOther: 'Please specify other role',
      interestAbout: 'Tell us a little more about yourself (interests & skills)',
      interestDiscovery: 'How did you learn about our volunteer programme?',
      discovery: {
        existing: 'Existing Love 21 volunteer',
        social: "Love 21's social media",
        edm: "Love 21's eDM / email",
        company: 'Company',
        other: 'Other',
      },
      interestDiscoveryOther: 'Please specify',
      interestSubmit: 'Submit volunteer signup',
      interestCancel: 'Cancel',
      hubSignupTitle: 'Sign up as a Love 21 volunteer',
      hubSignupSubhead: 'Same fields as our current volunteer form — DEMO-ONLY until wired to staff email.',
      hubSignupCta: 'Open signup form',
      joinConfirmTitle: 'Join this session?',
      joinConfirmBody: 'We’ll hold your spot and email confirmation details. DEMO-ONLY — no real booking yet.',
      joinConfirmYes: 'Yes, I’m in',
      joinConfirmNo: 'Not yet',
      successTitle: 'You’re down for {session}.',
      successBody: 'Thanks for showing up. Want this every week?',
      successGiveCta: 'Support with a gift',
      successHome: 'Back to home',
      corporatePanelTitle: 'Corporate volunteering',
      corporateBullets: [
        'African drumming workshops',
        'Zumba fitness sessions',
        'Healthy cooking classes',
        'Arts and crafts with members',
      ],
      corporateFormTitle: 'Tell us about your team',
      corporateOrg: 'Organisation',
      corporateContact: 'Contact name',
      corporateEmail: 'Work email',
      corporateMessage: 'What are you hoping to do?',
      corporateSubmit: 'Send enquiry',
      corporateThanks: 'Thanks — we’ll reply by email. DEMO-ONLY; nothing was sent.',
      changeMode: 'Choose a different path',
    },
    give: {
      kicker: 'Support',
      title: 'Give with meaning',
      subhead: 'Money, things, or a campaign friends can join — your gift keeps programmes free for members.',
      demoBanner: 'Demo — no real payments. Stripe test mode later.',
      tabMoney: 'Money',
      tabWishlist: 'Wishlist',
      tabFundraise: 'Fundraise',
      amountLabel: 'Your gift (HKD)',
      customAmountLabel: 'Or enter any amount',
      customAmountHint: 'Every dollar counts — type any amount from HK$1.',
      everyDollarCounts: 'Every dollar counts!',
      impactLabel: 'What this becomes',
      impactSmall: 'Every dollar helps keep programmes free for members.',
      once: 'Once',
      weekly: 'Weekly',
      monthly: 'Monthly',
      programmeLabel: 'Optional programme',
      receiptNote:
        'For donations of HK$100 or above, an official receipt can be issued and mailed on request. Contact Maggie at Maggie@love21foundation.com.',
      otherMeansTitle: 'Donate by other means',
      otherMeansBank: 'HSBC transfer: 582-350526-838 · FPS ID: 164778151',
      otherMeansCheque: 'Cheques payable to "Love 21 Foundation Limited".',
      otherMeansAddress:
        'Mail to: 1102, 11/F, Artisan Lab, 21 Luk Hop Street, San Po Kong, Kowloon, HK.',
      programmes: {
        sports: 'Sports',
        fitness: 'Fitness',
        nutrition: 'Nutrition',
        family: 'Family',
        where_needed: 'Where needed most',
      },
      section88: 'Donations of HK$100 or more are tax-deductible under Section 88.',
      trustStrip: '~86% of funds go to programmes (Annual Report).',
      emailLabel: 'Email for updates',
      emailHint: 'Needed so we can tell you when this gift was used. No password required to give.',
      donateCta: 'Donate',
      wishlistTitle: 'Wishlist',
      wishlistSubhead: 'Pledge items our programmes need — we’ll email how to send or drop off.',
      needed: 'Needed {n}',
      pledged: 'Pledged {n}',
      pledgeCta: 'Pledge',
      pledgeTitle: 'Pledge this item',
      pledgeQty: 'Quantity',
      pledgeNote: 'Note (optional)',
      pledgeSubmit: 'Send pledge',
      pledgeSuccess: 'We’ll email how to send or drop off — DEMO-ONLY.',
      pledgeClose: 'Close',
      wishlistEmpty: 'Nothing on the wishlist right now.',
      fundraiseTitle: 'Create a fundraiser',
      fundraiseSubhead: 'Three steps: create, wait for approval, then share and watch progress.',
      fundraiseSteps: [
        'Create your page',
        'We review (approval)',
        'Share & see progress',
      ],
      fundraisePendingNote:
        'DEMO-ONLY: campaigns may go live without staff review in this build.',
      createCampaignCta: 'Start a campaign',
      yourCampaigns: 'Your campaigns (this browser)',
      noCampaigns: 'No campaigns yet — create one above.',
      formTitle: 'Campaign title',
      formStory: 'Your story',
      formGoal: 'Goal (HKD)',
      formCover: 'Cover image',
      formEnd: 'End date',
      formSubmit: 'Create campaign',
      campaignProgress: 'HK${raised} of HK${goal}',
      campaignShare: 'Copy link',
      campaignShareDone: 'Link copied',
      campaignDonate: 'Donate to this campaign',
      campaignPending: 'Pending approval',
      campaignNotFound: 'We couldn’t find that campaign.',
      stickyDonate: 'Donate',
      thanksAck: 'Thank you. Your gift helps keep programmes free for members.',
      thanksNotifyLabel: 'Email me when there’s news on how this gift was used.',
      thanksNotifyHelper:
        'Only when something real happened — e.g. a session ran. No newsletter spam.',
      thanksEmail: 'Email',
      thanksNotifyToast: 'You’ll get updates at {email} (DEMO-ONLY)',
      thanksSampleUpdate:
        'Sample update: “Your gift helped make Saturday’s dance class possible.”',
      thanksCreateAccount: 'Want gifts and volunteer hours in one place?',
      thanksCreateAccountBody:
        'Create a free account with this email — we’ll attach this gift automatically.',
      thanksCreateCta: 'Create account',
      thanksNoThanks: 'No thanks — email updates are enough',
      thanksExistingBody: 'We found an account for this email — this gift is on it.',
      thanksViewGiving: 'View your giving',
      thanksVolunteer: 'Volunteer',
      thanksShareCampaign: 'Share a campaign',
      thanksHome: 'Home',
    },
  },
  'zh-Hant': {
    nav: {
      home: '首頁',
      community: '社群',
      about: '關於',
      news: '新聞',
      volunteer: '義工',
      give: '捐助',
      donate: '捐款',
      login: '登入',
      easyRead: '簡易閱讀',
      language: '語言',
      skipToContent: '跳至內容',
    },
    hero: {
      eyebrow: '#Somuchability',
      line1: '無限',
      line2: '能力',
      subhead: '運動、營養與家庭支援計劃——會員免費。',
      cta: '看看他們的能力',
    },
    stats: {
      title: '看得見的影響',
      updated: '30 秒前更新 · 2024/25 年度報告',
      items: [
        { value: 6859, suffix: '', label: '課程總節數（2024/25）' },
        { value: 490, suffix: '', label: '支援家庭' },
        { value: 84, suffix: '', label: '活動種類' },
        { value: 1000, suffix: '+', label: '義工時數 / 月' },
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
volunteer: {
      kicker: '參與',
      title: '現身。認識他們。',
      subhead: '面對面，偏見才會縮小。選一節課，帶上你的能量——一起參與，不是旁觀。',
      communityLink: '先看看社群',
      demoMatch: '僅示範 — 技能篩選為本地假資料，並非即時 AI 配對。',
      modeTitle: '你想怎樣參與？',
      individualTag: '個人',
      individualTitle: '報名或協助課堂',
      individualBody: '以參與者身份加入一節課。HandsOn 與 Love 21 課堂，集中在此。',
      individualCta: '瀏覽課堂',
      corporateTag: '企業',
      corporateTitle: '企業義工與捐助',
      corporateBody: '團隊義工——非洲鼓、Zumba、烹飪、藝術。聯絡我們，一起策劃。',
      corporateCta: '企業查詢',
      skillsTitle: '你能帶來什麼？',
      skillsHint: '可選 — 點選篩選。僅示範配對。',
      skills: {
        patient: '有耐心',
        sports: '運動',
        music: '音樂',
        kitchen: '廚房',
        photography: '攝影',
        youth14: '青少年 14+',
        cantonese: '粵語（可選）',
      },
      clearSkills: '清除篩選',
      listTitle: '開放課堂',
      emptyList: '沒有符合這些技能的課堂——試試清除篩選。',
      recruiting: '招募中',
      spots: '{filled}/{capacity} 名額',
      sourceLove21: 'Love 21',
      sourceHandson: 'HandsOn',
      viewDetail: '查看課堂',
      backToHub: '所有課堂',
      detailWhat: '你實際會做什麼',
      detailEligibility: '誰可以參加',
      detailSafeguard:
        '保護措施：教練會在場。首次課堂前我們可能請你簡單自我介紹——完整流程仍與 Love 21 敲定中。',
      handsonCapacity:
        'HandsOn：已訂 {filled}/{capacity} · 此處有興趣 {interested} 人',
      registerInterest: '登記興趣',
      completeHandson: '前往 HandsOn 完成報名',
      joinSession: '加入課堂',
      formIntro:
        'Love 21 為香港註冊慈善機構，致力透過運動、營養及全方位支援計劃，支持唐氏綜合症、自閉症及神經多樣性社群。我們現正尋找充滿熱誠的義工！',
      interestChineseName: '中文全名',
      interestEnglishName: '英文全名',
      interestAgeGroup: '年齡組別',
      ageGroups: {
        age14_15: '14–15 歲',
        age16_17: '16–17 歲',
        age18: '18 歲或以上',
      },
      interestGender: '性別',
      genders: {
        female: '女',
        male: '男',
        prefer_not: '不透露',
      },
      interestEmail: '聯絡電郵',
      interestPhone: '聯絡電話',
      interestRoles: '請問你對哪一個義工角色感興趣？（可選多項）',
      roles: {
        assistant: '我想以助教身份參與現有課堂',
        host: '我想自己帶領一個課堂',
        event: '我想成為大型活動義工',
        other: '其他',
      },
      interestRoleOther: '請註明其他角色',
      interestAbout: '告訴我們你的喜好和專長吧！',
      interestDiscovery: '請問你從什麼渠道知道 Love 21 的義工機會？',
      discovery: {
        existing: '一向有參加 Love 21 義工活動',
        social: '社交媒體',
        edm: '通訊電郵',
        company: '公司',
        other: '其他',
      },
      interestDiscoveryOther: '請註明',
      interestSubmit: '提交義工報名',
      interestCancel: '取消',
      hubSignupTitle: 'Love 21 義工報名',
      hubSignupSubhead: '欄位與現有義工表格一致 — 僅示範，稍後才接職員電郵。',
      hubSignupCta: '打開報名表格',
      joinConfirmTitle: '加入這個課堂？',
      joinConfirmBody: '我們會為你預留名額並電郵確認。僅示範 — 尚未真實報名。',
      joinConfirmYes: '好，我參加',
      joinConfirmNo: '先不要',
      successTitle: '你已報名「{session}」。',
      successBody: '多謝現身。想每星期都支持？',
      successGiveCta: '以捐助支持',
      successHome: '返回首頁',
      corporatePanelTitle: '企業義工',
      corporateBullets: [
        '非洲鼓工作坊',
        'Zumba 健身課',
        '健康烹飪班',
        '與學員一起做手工藝術',
      ],
      corporateFormTitle: '告訴我們你的團隊',
      corporateOrg: '機構名稱',
      corporateContact: '聯絡人',
      corporateEmail: '公司電郵',
      corporateMessage: '你們希望做什麼？',
      corporateSubmit: '送出查詢',
      corporateThanks: '謝謝——我們會以電郵回覆。僅示範；實際未發送。',
      changeMode: '選擇另一條路',
    },
    give: {
      kicker: '支持',
      title: '有意義的捐助',
      subhead: '金錢、物資，或讓朋友一起參與的籌款——你的捐助讓會員計劃保持免費。',
      demoBanner: '示範 — 並無真實付款。稍後接 Stripe 測試模式。',
      tabMoney: '捐款',
      tabWishlist: '心願清單',
      tabFundraise: '籌款',
      amountLabel: '你的捐款（港幣）',
      customAmountLabel: '或輸入任何金額',
      customAmountHint: '每一元都有意義 — 可由港幣 1 元起。',
      everyDollarCounts: '每一元都有意義！',
      impactLabel: '這筆捐款能成為',
      impactSmall: '每一元都幫助會員計劃保持免費。',
      once: '一次過',
      weekly: '每週',
      monthly: '每月',
      programmeLabel: '可選計劃',
      receiptNote:
        '捐款港幣 100 元或以上，可應要求發出正式收據並郵寄。查詢請聯絡 Maggie：Maggie@love21foundation.com。',
      otherMeansTitle: '其他捐款方式',
      otherMeansBank: '匯豐銀行過數：582-350526-838 · FPS ID：164778151',
      otherMeansCheque: '支票抬頭：「Love 21 Foundation Limited」。',
      otherMeansAddress:
        '郵寄地址：香港九龍新蒲崗六合街 21 號 Artisan Lab 11 樓 1102 室。',
      programmes: {
        sports: '運動',
        fitness: '體能',
        nutrition: '營養',
        family: '家庭',
        where_needed: '最需要的地方',
      },
      section88: '港幣 100 元或以上捐款可根據第 88 條申請扣稅。',
      trustStrip: '約 86% 資金用於計劃（年度報告）。',
      emailLabel: '接收更新的電郵',
      emailHint: '以便告知這筆捐款何時被使用。捐款無需密碼。',
      donateCta: '捐款',
      wishlistTitle: '心願清單',
      wishlistSubhead: '認捐計劃所需物資——我們會電郵說明如何送交或自取。',
      needed: '需要 {n}',
      pledged: '已認捐 {n}',
      pledgeCta: '認捐',
      pledgeTitle: '認捐此項目',
      pledgeQty: '數量',
      pledgeNote: '備註（可選）',
      pledgeSubmit: '送出認捐',
      pledgeSuccess: '我們會電郵說明如何送交或自取 — 僅示範。',
      pledgeClose: '關閉',
      wishlistEmpty: '目前心願清單沒有項目。',
      fundraiseTitle: '發起籌款',
      fundraiseSubhead: '三步：建立、等候審批，然後分享並查看進度。',
      fundraiseSteps: ['建立頁面', '我們審批', '分享並查看進度'],
      fundraisePendingNote: '僅示範：此版本中籌款活動可能未經職員審核即上線。',
      createCampaignCta: '開始籌款',
      yourCampaigns: '你的籌款（此瀏覽器）',
      noCampaigns: '尚未有籌款——請在上方建立。',
      formTitle: '籌款標題',
      formStory: '你的故事',
      formGoal: '目標（港幣）',
      formCover: '封面圖片',
      formEnd: '結束日期',
      formSubmit: '建立籌款',
      campaignProgress: '已籌 HK${raised}／目標 HK${goal}',
      campaignShare: '複製連結',
      campaignShareDone: '已複製連結',
      campaignDonate: '捐給此籌款',
      campaignPending: '等候審批',
      campaignNotFound: '找不到此籌款。',
      stickyDonate: '捐款',
      thanksAck: '謝謝你。你的捐助幫助會員計劃保持免費。',
      thanksNotifyLabel: '有這筆捐款如何被使用的消息時，電郵通知我。',
      thanksNotifyHelper: '只在真實事情發生時——例如一節課舉行了。不會濫發電郵。',
      thanksEmail: '電郵',
      thanksNotifyToast: '你會在 {email} 收到更新（僅示範）',
      thanksSampleUpdate: '示範更新：「你的捐助幫助週六舞蹈班得以舉行。」',
      thanksCreateAccount: '想把捐助與義工時數放在同一處？',
      thanksCreateAccountBody: '用此電郵建立免費帳戶——我們會自動附上這筆捐助。',
      thanksCreateCta: '建立帳戶',
      thanksNoThanks: '不用了——電郵更新已足夠',
      thanksExistingBody: '我們找到此電郵的帳戶——這筆捐助已在帳戶上。',
      thanksViewGiving: '查看你的捐助',
      thanksVolunteer: '做義工',
      thanksShareCampaign: '分享籌款',
      thanksHome: '首頁',
    },
  },
  'zh-Hans': {
    nav: {
      home: '首页',
      community: '社群',
        about: '关于',
        news: '新闻',
      volunteer: '义工',
      give: '捐助',
      donate: '捐款',
      login: '登录',
      easyRead: '简易阅读',
      language: '语言',
      skipToContent: '跳至内容',
    },
    hero: {
      eyebrow: '#Somuchability',
      line1: '无限',
      line2: '能力',
      subhead: '运动、营养与家庭支援计划——会员免费。',
      cta: '看看他们的能力',
    },
    stats: {
      title: '看得见的影响',
      updated: '30 秒前更新 · 2024/25 年度报告',
      items: [
        { value: 6859, suffix: '', label: '课程总节数（2024/25）' },
        { value: 490, suffix: '', label: '支援家庭' },
        { value: 84, suffix: '', label: '活动种类' },
        { value: 1000, suffix: '+', label: '义工时数 / 月' },
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
    map: {
      kicker: '遍布香港',
      title: '我们的聚脚点',
      subhead: '我们的活动遍布全港各区。',
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
volunteer: {
      kicker: '参与',
      title: '现身。认识他们。',
      subhead: '面对面，偏见才会缩小。选一节课，带上你的能量——一起参与，不是旁观。',
      communityLink: '先看看社群',
      demoMatch: '仅演示 — 技能筛选为本地假数据，并非即时 AI 配对。',
      modeTitle: '你想怎样参与？',
      individualTag: '个人',
      individualTitle: '报名或协助课堂',
      individualBody: '以参与者身份加入一节课。HandsOn 与 Love 21 课堂，集中在此。',
      individualCta: '浏览课堂',
      corporateTag: '企业',
      corporateTitle: '企业义工与捐助',
      corporateBody: '团队义工——非洲鼓、Zumba、烹饪、艺术。联系我们，一起策划。',
      corporateCta: '企业查询',
      skillsTitle: '你能带来什么？',
      skillsHint: '可选 — 点选筛选。仅演示配对。',
      skills: {
        patient: '有耐心',
        sports: '运动',
        music: '音乐',
        kitchen: '厨房',
        photography: '摄影',
        youth14: '青少年 14+',
        cantonese: '粤语（可选）',
      },
      clearSkills: '清除筛选',
      listTitle: '开放课堂',
      emptyList: '没有符合这些技能的课堂——试试清除筛选。',
      recruiting: '招募中',
      spots: '{filled}/{capacity} 名额',
      sourceLove21: 'Love 21',
      sourceHandson: 'HandsOn',
      viewDetail: '查看课堂',
      backToHub: '所有课堂',
      detailWhat: '你实际会做什么',
      detailEligibility: '谁可以参加',
      detailSafeguard:
        '保护措施：教练会在场。首次课堂前我们可能请你简单自我介绍——完整流程仍与 Love 21 敲定中。',
      handsonCapacity:
        'HandsOn：已订 {filled}/{capacity} · 此处有兴趣 {interested} 人',
      registerInterest: '登记兴趣',
      completeHandson: '前往 HandsOn 完成报名',
      joinSession: '加入课堂',
      formIntro:
        'Love 21 为香港注册慈善机构，致力透过运动、营养及全方位支援计划，支持唐氏综合症、自闭症及神经多样性社群。我们现正寻找充满热诚的义工！',
      interestChineseName: '中文全名',
      interestEnglishName: '英文全名',
      interestAgeGroup: '年龄组别',
      ageGroups: {
        age14_15: '14–15 岁',
        age16_17: '16–17 岁',
        age18: '18 岁或以上',
      },
      interestGender: '性别',
      genders: {
        female: '女',
        male: '男',
        prefer_not: '不透露',
      },
      interestEmail: '联络电邮',
      interestPhone: '联络电话',
      interestRoles: '请问你对哪一个义工角色感兴趣？（可选多项）',
      roles: {
        assistant: '我想以助教身份参与现有课堂',
        host: '我想自己带领一个课堂',
        event: '我想成为大型活动义工',
        other: '其他',
      },
      interestRoleOther: '请注明其他角色',
      interestAbout: '告诉我们你的喜好和专长吧！',
      interestDiscovery: '请问你从什么渠道知道 Love 21 的义工机会？',
      discovery: {
        existing: '一向有参加 Love 21 义工活动',
        social: '社交媒体',
        edm: '通讯电邮',
        company: '公司',
        other: '其他',
      },
      interestDiscoveryOther: '请注明',
      interestSubmit: '提交义工报名',
      interestCancel: '取消',
      hubSignupTitle: 'Love 21 义工报名',
      hubSignupSubhead: '栏位与现有义工表格一致 — 仅演示，稍后才接职员电邮。',
      hubSignupCta: '打开报名表格',
      joinConfirmTitle: '加入这个课堂？',
      joinConfirmBody: '我们会为你预留名额并电邮确认。仅演示 — 尚未真实报名。',
      joinConfirmYes: '好，我参加',
      joinConfirmNo: '先不要',
      successTitle: '你已报名「{session}」。',
      successBody: '多谢现身。想每星期都支持？',
      successGiveCta: '以捐助支持',
      successHome: '返回首页',
      corporatePanelTitle: '企业义工',
      corporateBullets: [
        '非洲鼓工作坊',
        'Zumba 健身课',
        '健康烹饪班',
        '与学员一起做手工艺术',
      ],
      corporateFormTitle: '告诉我们你的团队',
      corporateOrg: '机构名称',
      corporateContact: '联络人',
      corporateEmail: '公司电邮',
      corporateMessage: '你们希望做什么？',
      corporateSubmit: '送出查询',
      corporateThanks: '谢谢——我们会以电邮回复。仅演示；实际未发送。',
      changeMode: '选择另一条路',
    },
    give: {
      kicker: '支持',
      title: '有意义的捐助',
      subhead: '金钱、物资，或让朋友一起参与的筹款——你的捐助让会员计划保持免费。',
      demoBanner: '演示 — 并无真实付款。稍后接 Stripe 测试模式。',
      tabMoney: '捐款',
      tabWishlist: '心愿清单',
      tabFundraise: '筹款',
      amountLabel: '你的捐款（港币）',
      customAmountLabel: '或输入任何金额',
      customAmountHint: '每一元都有意义 — 可由港币 1 元起。',
      everyDollarCounts: '每一元都有意义！',
      impactLabel: '这笔捐款能成为',
      impactSmall: '每一元都帮助会员计划保持免费。',
      once: '一次过',
      weekly: '每周',
      monthly: '每月',
      programmeLabel: '可选计划',
      receiptNote:
        '捐款港币 100 元或以上，可应要求发出正式收据并邮寄。查询请联络 Maggie：Maggie@love21foundation.com。',
      otherMeansTitle: '其他捐款方式',
      otherMeansBank: '汇丰银行过数：582-350526-838 · FPS ID：164778151',
      otherMeansCheque: '支票抬头：「Love 21 Foundation Limited」。',
      otherMeansAddress:
        '邮寄地址：香港九龙新蒲岗六合街 21 号 Artisan Lab 11 楼 1102 室。',
      programmes: {
        sports: '运动',
        fitness: '体能',
        nutrition: '营养',
        family: '家庭',
        where_needed: '最需要的地方',
      },
      section88: '港币 100 元或以上捐款可根据第 88 条申请扣税。',
      trustStrip: '约 86% 资金用于计划（年度报告）。',
      emailLabel: '接收更新的电邮',
      emailHint: '以便告知这笔捐款何时被使用。捐款无需密码。',
      donateCta: '捐款',
      wishlistTitle: '心愿清单',
      wishlistSubhead: '认捐计划所需物资——我们会电邮说明如何送交或自取。',
      needed: '需要 {n}',
      pledged: '已认捐 {n}',
      pledgeCta: '认捐',
      pledgeTitle: '认捐此项目',
      pledgeQty: '数量',
      pledgeNote: '备注（可选）',
      pledgeSubmit: '送出认捐',
      pledgeSuccess: '我们会电邮说明如何送交或自取 — 仅演示。',
      pledgeClose: '关闭',
      wishlistEmpty: '目前心愿清单没有项目。',
      fundraiseTitle: '发起筹款',
      fundraiseSubhead: '三步：建立、等候审批，然后分享并查看进度。',
      fundraiseSteps: ['建立页面', '我们审批', '分享并查看进度'],
      fundraisePendingNote: '仅演示：此版本中筹款活动可能未经职员审核即上线。',
      createCampaignCta: '开始筹款',
      yourCampaigns: '你的筹款（此浏览器）',
      noCampaigns: '尚未有筹款——请在上方建立。',
      formTitle: '筹款标题',
      formStory: '你的故事',
      formGoal: '目标（港币）',
      formCover: '封面图片',
      formEnd: '结束日期',
      formSubmit: '建立筹款',
      campaignProgress: '已筹 HK${raised}／目标 HK${goal}',
      campaignShare: '复制链接',
      campaignShareDone: '已复制链接',
      campaignDonate: '捐给此筹款',
      campaignPending: '等候审批',
      campaignNotFound: '找不到此筹款。',
      stickyDonate: '捐款',
      thanksAck: '谢谢你。你的捐助帮助会员计划保持免费。',
      thanksNotifyLabel: '有这笔捐款如何被使用的消息时，电邮通知我。',
      thanksNotifyHelper: '只在真实事情发生时——例如一节课举行了。不会滥发电邮。',
      thanksEmail: '电邮',
      thanksNotifyToast: '你会在 {email} 收到更新（仅演示）',
      thanksSampleUpdate: '演示更新：「你的捐助帮助周六舞蹈班得以举行。」',
      thanksCreateAccount: '想把捐助与义工时数放在同一处？',
      thanksCreateAccountBody: '用此电邮建立免费账户——我们会自动附上这笔捐助。',
      thanksCreateCta: '建立账户',
      thanksNoThanks: '不用了——电邮更新已足够',
      thanksExistingBody: '我们找到此电邮的账户——这笔捐助已在账户上。',
      thanksViewGiving: '查看你的捐助',
      thanksVolunteer: '做义工',
      thanksShareCampaign: '分享筹款',
      thanksHome: '首页',
    },
  },
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

function deepMerge<T extends Record<string, unknown>>(base: T, over: DeepPartial<T>): T {
  const out = { ...base }
  for (const key of Object.keys(over) as (keyof T)[]) {
    const b = base[key]
    const o = over[key]
    if (
      o &&
      typeof o === 'object' &&
      !Array.isArray(o) &&
      b &&
      typeof b === 'object' &&
      !Array.isArray(b)
    ) {
      out[key] = deepMerge(
        b as Record<string, unknown>,
        o as DeepPartial<Record<string, unknown>>,
      ) as T[keyof T]
    } else if (o !== undefined) {
      out[key] = o as T[keyof T]
    }
  }
  return out
}

/** UK Easy Read overlays — short sentences, no contractions, everyday words.
 *  Pictures are paired in components (image left, words right). */
const EASY_READ_EN: DeepPartial<Strings> = {
  // Keep nav labels stable (Community stays Community) — only body copy simplifies.
  hero: {
    eyebrow: 'Love 21',
    line1: 'So much',
    line2: 'ability',
    subhead:
      'We help people with Down syndrome and autism in Hong Kong. Sport and food classes are free.',
    cta: 'See what they can do',
  },
  stats: {
    title: 'Our numbers',
    updated: 'These numbers are from our yearly report.',
    items: [
      { value: 6859, suffix: '', label: 'classes last year' },
      { value: 490, suffix: '', label: 'families we help' },
      { value: 84, suffix: '', label: 'kinds of activities' },
      { value: 1000, suffix: '+', label: 'volunteer hours each month' },
    ],
  },
  activities: {
    title: 'Coming soon',
    subhead: 'You can join a class. Or you can come and watch.',
    recruiting: 'We need helpers',
    joinCta: 'Help at this class',
    viewCta: 'See this class',
  },
  spotlight: {
    title: 'What people can do',
    subhead: 'These are real stories.',
    reveal: 'Meet',
    readMore: 'Read more',
  },
  paths: {
    title: 'Three ways to help',
    subhead: 'Choose one.',
    witness: {
      tag: 'Look',
      title: 'See our stories',
      body: 'Read about people and what they can do.',
      cta: 'Go to stories',
    },
    take: {
      tag: 'Help',
      title: 'Be a volunteer',
      body: 'Come to a class and help.',
      cta: 'Volunteer',
    },
    support: {
      tag: 'Give',
      title: 'Give money',
      body: 'Your money helps pay for free classes.',
      cta: 'Donate',
    },
  },
  footer: {
    tax: 'Love 21 is a charity in Hong Kong. Gifts of HK$100 or more can get tax relief.',
    portal: 'Member website',
    support: 'Get help',
    followUs: 'Find us online',
    rights: 'All rights reserved.',
  },
  community: {
    eyebrow: 'Stories',
    title: 'What people can do',
    subhead: 'Read short stories. Learn facts. Share a moment if you want.',
  },
  volunteer: {
    kicker: 'Help out',
    title: 'Come and help',
    subhead: 'Meet our members. Help at a class.',
    communityLink: 'Read stories first',
    modeTitle: 'How do you want to help?',
    individualTag: 'One person',
    individualTitle: 'I want to help',
    individualBody: 'Pick a class and sign up.',
    individualCta: 'Find a class',
    corporateTag: 'A company',
    corporateTitle: 'My company can help',
    corporateBody: 'Tell us. We will contact you. We do not book online.',
    corporateCta: 'Contact us',
  },
  give: {
    kicker: 'Give',
    title: 'Give to Love 21',
    subhead: 'Give money. Or give things. Or raise money with friends.',
    demoBanner: 'This is a demo. No real money is taken.',
    tabMoney: 'Money',
    tabWishlist: 'Things we need',
    tabFundraise: 'Raise money',
    thanksAck: 'Thank you. Your gift helps keep classes free.',
    thanksNotifyLabel: 'Email me when you use my gift.',
    thanksNotifyHelper: 'We only email when something real happens. Not spam.',
    thanksNoThanks: 'No thanks. Email updates are enough.',
    thanksCreateAccount: 'Want gifts and volunteer hours in one place?',
    thanksCreateAccountBody: 'Make a free account with this email. We will add this gift.',
    thanksCreateCta: 'Make an account',
  },
}

/** Standard copy, or UK Easy Read overlay when easyRead is on (EN first; zh falls back). */
export function getStrings(locale: Locale, easyRead: boolean): Strings {
  const base = STRINGS[locale]
  if (!easyRead) return base
  if (locale === 'en') return deepMerge(base, EASY_READ_EN)
  // Traditional / Simplified: keep structure; still apply EN easy nav labels lightly via layout
  return deepMerge(base, {
    nav: { easyRead: locale === 'zh-Hans' ? '简易阅读' : '簡易閱讀' },
  } as DeepPartial<Strings>)
}

