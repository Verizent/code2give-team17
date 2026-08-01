// Bilingual seed content drawn from the Love 21 annual reports and CONTEXT.md §20.
//
// Not every article carries a `_zh` translation, on purpose. The tail is English-only
// so `resolveLocale`'s EN fallback is exercised by real data rather than only by unit
// tests — a seed that translates everything hides the one path most likely to break.
//
// `slug`, `status`, `published_at` and `reading_time_minutes` are set here rather than
// derived: the seed writes finished published rows, whereas the admin create path
// derives them. Both agree on the shape.

const p = (text) => ({ type: "paragraph", text });
const h = (text) => ({ type: "heading", level: 2, text });
const stat = (value, label, sublabel) => ({ type: "stat", value, label, sublabel });

const VOLUNTEER_CTA_EN =
  "Curious what a session actually looks like? Volunteering is the shortest way to find out — no experience needed, and you can come once to see.";
const VOLUNTEER_CTA_ZH =
  "想知道課堂實際是怎樣的？親身當義工是最直接的方法——無需相關經驗，你可以先來一次看看。";

const articles = [
  // ---------------------------------------------------------------- updates (news)
  {
    slug: "the-phoenix-year",
    category: "news",
    status: "published",
    published_at: "2023-11-02T00:00:00.000Z",
    is_featured: true,
    tags: ["update", "centre"],
    author: "Love 21 Foundation",
    reading_time_minutes: 3,
    title_en: "The phoenix year: from a fire in January to a bigger home in October",
    title_zh: "浴火重生的一年：由一月的火災到十月的新家",
    excerpt_en:
      "A fire closed our centre in January 2023. Nine months later we reopened in San Po Kong — with more room than we had before.",
    excerpt_zh:
      "2023 年一月的一場火災令中心關閉。九個月後，我們在新蒲崗重開，空間比以前更大。",
    cover_alt_en: "Volunteers and families at the reopened San Po Kong centre",
    cover_alt_zh: "義工與家庭在重開的新蒲崗中心",
    body_en: [
      p("In January 2023 a fire took our centre out of use. For a charity whose entire model is a physical room where people show up, that is close to an existential problem."),
      p("Sessions did not stop. They moved — into borrowed spaces, parks, and the homes of people who volunteered them. Attendance dipped and then recovered, which told us something about how much the community wanted it back."),
      h("A larger home"),
      p("In October 2023 we reopened in San Po Kong, in a space larger than the one we lost. The extra floor area is not a luxury: it is the difference between running two programmes at once and making families choose."),
    ],
    body_zh: [
      p("2023 年一月，一場火災令我們的中心無法使用。對一個以實體空間為核心的機構而言，這幾乎是生存問題。"),
      p("課堂並沒有停止，只是搬遷——借用的場地、公園，以及義工主動提供的地方。出席人數先跌後回升，這說明了社群有多希望它回來。"),
      h("更大的家"),
      p("2023 年十月，我們在新蒲崗重開，空間比失去的更大。多出來的面積並非奢侈：它決定了我們能否同時舉辦兩個課程，而不必讓家庭二選一。"),
    ],
  },
  {
    slug: "first-gala-raises-3-8m",
    category: "news",
    status: "published",
    published_at: "2024-05-18T00:00:00.000Z",
    is_featured: true,
    tags: ["update", "fundraising"],
    author: "Love 21 Foundation",
    reading_time_minutes: 2,
    title_en: "Our first gala raised HKD 3.8M and brought in 100+ new families",
    title_zh: "首屆籌款晚宴籌得 380 萬港元，並帶來超過 100 個新家庭",
    excerpt_en:
      "The money matters. The hundred-plus families who found us because of it matter more.",
    excerpt_zh: "善款固然重要，但因此認識我們的一百多個家庭更為重要。",
    cover_alt_en: "Guests at the Love 21 fundraising gala",
    cover_alt_zh: "Love 21 籌款晚宴的來賓",
    body_en: [
      p("Our first gala raised HKD 3.8 million. For an organisation that had never run one, the number was a surprise."),
      stat("3.8M", "HKD raised", "first gala, 2024"),
      stat("100+", "new families reached", "in the months following"),
      p("The more durable outcome was reach. More than a hundred families came to us in the months afterwards, most of whom had never heard of Love 21 before the event was covered."),
    ],
    body_zh: [
      p("我們的首屆籌款晚宴籌得 380 萬港元。對一個從未辦過晚宴的機構來說，這個數字令人意外。"),
      stat("380萬", "籌得款項（港元）", "2024 年首屆晚宴"),
      stat("100+", "新接觸的家庭", "其後數月"),
      p("更持久的成果是接觸面。其後數月有超過一百個家庭前來，當中大部分在活動獲報導前從未聽過 Love 21。"),
    ],
  },
  {
    slug: "medals-at-asian-para-karate-bali",
    category: "news",
    status: "published",
    published_at: "2025-03-09T00:00:00.000Z",
    is_featured: false,
    tags: ["update", "sport"],
    author: "Love 21 Foundation",
    reading_time_minutes: 2,
    title_en: "Medals at the Asian Para-Karate Championships in Bali",
    title_zh: "峇里亞洲殘疾人空手道錦標賽奪牌",
    excerpt_en:
      "Athletes who started in a weekly session at our centre came home from Bali with medals.",
    excerpt_zh: "由每週課堂起步的運動員，從峇里帶著獎牌回來。",
    cover_alt_en: "Love 21 athletes with their medals in Bali",
    cover_alt_zh: "Love 21 運動員在峇里與獎牌合照",
    body_en: [
      p("Our athletes competed at the Asian Para-Karate Championships in Bali and came home with medals."),
      p("Every one of them started in an ordinary weekly session at the centre. Nobody was scouted; they turned up, kept turning up, and a coach noticed."),
      p("We mention that because the pipeline from a Tuesday-evening class to an international podium is not obvious, and it is worth saying that it exists."),
    ],
    body_zh: [
      p("我們的運動員參加了在峇里舉行的亞洲殘疾人空手道錦標賽，並帶著獎牌回來。"),
      p("他們每一位都是從中心的普通每週課堂開始。沒有人是被挑選的；他們來了，持續地來，然後被教練留意到。"),
      p("我們提及此事，是因為由星期二晚上的課堂通往國際頒獎台的路徑並不顯而易見，值得說明它確實存在。"),
    ],
  },

  // ---------------------------------------------------------------- stories (news)
  {
    slug: "marissa-walking-then-running",
    category: "news",
    status: "published",
    published_at: "2025-06-02T00:00:00.000Z",
    is_featured: true,
    tags: ["story"],
    author: "Love 21 Foundation",
    reading_time_minutes: 2,
    title_en: "Marissa, who walked and then ran",
    title_zh: "Marissa：先學會走，然後跑起來",
    excerpt_en: "She joined to get moving again. Eighteen months later she finished a 5K.",
    excerpt_zh: "她加入是為了重新活動起來。十八個月後，她完成了五公里。",
    cover_alt_en: "Marissa running at a community event",
    cover_alt_zh: "Marissa 在社區活動中跑步",
    body_en: [
      p("Marissa joined a fitness session because she wanted to move more. That was the whole ambition, and it was a reasonable one."),
      p("Progress was unremarkable week to week, which is how progress usually looks. Then eighteen months in she entered a 5K and finished it."),
      p("Her mother's comment afterwards was that nobody had ever suggested a distance event was available to her. That is the barrier this charity mostly exists to remove — not physical capability, but the assumption about it."),
    ],
    body_zh: [
      p("Marissa 參加健體課堂，是因為她想多些活動。這就是她全部的目標，而這是合理的。"),
      p("每星期的進展都平平無奇，進步通常就是這個樣子。然後在十八個月後，她報名參加五公里賽事並完成了。"),
      p("她母親事後說，從來沒有人向她提過長距離賽事是她可以參與的。這正是本機構主要要移除的障礙——不是身體能力，而是外界對它的假設。"),
    ],
  },
  {
    slug: "crystal-and-competitive-bocce",
    category: "news",
    status: "published",
    published_at: "2025-04-14T00:00:00.000Z",
    is_featured: false,
    tags: ["story", "sport"],
    author: "Love 21 Foundation",
    reading_time_minutes: 2,
    title_en: "Crystal found a sport she wanted to win at",
    excerpt_en:
      "Bocce started as something to try on a Saturday. It became the thing she trains for.",
    cover_alt_en: "Crystal playing bocce at the centre",
    body_en: [
      p("Crystal tried bocce because it was on that Saturday and she had not done it before."),
      p("What changed was not that she enjoyed it — plenty of people enjoy a session and never come back. It was that she wanted to be good at it, and started asking when she could practise."),
      p("She now competes. The competitive framing matters: being allowed to want to win is different from being allowed to take part."),
    ],
  },
  {
    slug: "the-eight-minute-plank",
    category: "news",
    status: "published",
    published_at: "2025-01-27T00:00:00.000Z",
    is_featured: false,
    tags: ["story", "fitness"],
    author: "Love 21 Foundation",
    reading_time_minutes: 1,
    title_en: "The eight-minute plank",
    excerpt_en: "A personal best that started as thirty seconds.",
    cover_alt_en: "A fitness session in progress at the centre",
    body_en: [
      p("One of our members holds a plank for eight minutes. He started at thirty seconds."),
      stat("8 min", "current personal best", "from 30 seconds"),
      p("There is no lesson attached to this. It is simply a very good plank, and he is rightly pleased with it."),
    ],
  },
  {
    slug: "e-9-and-the-swimming-pool",
    category: "news",
    status: "published",
    published_at: "2025-05-11T00:00:00.000Z",
    is_featured: false,
    tags: ["story"],
    author: "Love 21 Foundation",
    reading_time_minutes: 2,
    // Seeded as "E., 9" — first initial only. Her medical details are described and
    // she is a minor (CONTEXT.md §18.5). Do not expand this to a full name.
    title_en: "E., 9, and the swimming pool",
    excerpt_en:
      "Her family was told swimming was unlikely. She now swims weekly, which is the entire story.",
    cover_alt_en: "A child's swimming lesson at a community pool",
    body_en: [
      p("E. is nine. Her family were told early on that swimming was unlikely to be realistic for her, for reasons that were medically reasonable at the time."),
      p("She swims weekly now. It took two years and a coach willing to start from where she actually was rather than from a programme designed for someone else."),
      p("We are deliberately vague about her diagnosis here. It is hers to share, not ours, and she is nine."),
    ],
  },

  // ---------------------------------------------------------------- learn (education)
  {
    slug: "why-we-are-called-love-21",
    category: "education",
    status: "published",
    published_at: "2024-09-03T00:00:00.000Z",
    is_featured: true,
    tags: ["education", "basics"],
    author: "Love 21 Foundation",
    reading_time_minutes: 3,
    title_en: "Why we are called Love 21",
    title_zh: "我們為何叫 Love 21",
    excerpt_en:
      "The 21 is the chromosome. Down syndrome is trisomy 21 — three copies where there are usually two.",
    excerpt_zh: "「21」指的是染色體。唐氏綜合症即 21 三體症——本應兩條的地方有三條。",
    cover_alt_en: "A Love 21 session in progress",
    cover_alt_zh: "進行中的 Love 21 課堂",
    body_en: [
      h("The chromosome"),
      p("Most people have two copies of chromosome 21. People with Down syndrome have three, which is why the clinical name is trisomy 21."),
      p("That extra copy affects development in ways that vary enormously between individuals. The variation is the part most often missed: knowing someone has Down syndrome tells you very little about what they can do."),
      h("Why it is in our name"),
      p("We work with people with Down syndrome and other disabilities. Naming ourselves after the chromosome rather than the deficit was deliberate."),
      p(VOLUNTEER_CTA_EN),
    ],
    body_zh: [
      h("那條染色體"),
      p("大部分人有兩條第 21 號染色體。唐氏綜合症人士有三條，因此其臨床名稱為 21 三體症。"),
      p("這條額外的染色體對發展的影響因人而異，差異極大。最常被忽略的正是這種差異：知道某人有唐氏綜合症，其實幾乎無法告訴你他能做甚麼。"),
      h("為何寫進名字裡"),
      p("我們服務唐氏綜合症及其他殘疾人士。以染色體而非缺陷為名，是刻意的決定。"),
      p(VOLUNTEER_CTA_ZH),
    ],
  },
  {
    slug: "autism-and-neurodiversity-basics",
    category: "education",
    status: "published",
    published_at: "2024-10-15T00:00:00.000Z",
    is_featured: false,
    tags: ["education", "basics"],
    author: "Love 21 Foundation",
    reading_time_minutes: 3,
    title_en: "Autism and neurodiversity: the basics",
    title_zh: "自閉症與神經多樣性：基礎知識",
    excerpt_en:
      "Neurodiversity treats variation in how brains work as ordinary human variation rather than as a fault to correct.",
    excerpt_zh: "神經多樣性視大腦運作的差異為普通的人類差異，而非需要矯正的缺陷。",
    cover_alt_en: "A quiet corner of the centre set up for sensory breaks",
    cover_alt_zh: "中心內設置的感官休息角落",
    body_en: [
      p("Autism is a developmental difference affecting communication, sensory processing and social interaction. It is a spectrum, which means presentations differ widely."),
      h("What neurodiversity adds"),
      p("The neurodiversity framing treats these differences as ordinary variation rather than defects. Practically, that changes what you build: quiet spaces, predictable structure, and not requiring eye contact are accommodations, not indulgences."),
      p(VOLUNTEER_CTA_EN),
    ],
    body_zh: [
      p("自閉症是一種影響溝通、感官處理及社交互動的發展差異。它是一個光譜，因此表現形式差異很大。"),
      h("神經多樣性的補充"),
      p("神經多樣性的視角視這些差異為普通差異而非缺陷。實際上，這會改變你的設計：安靜空間、可預測的流程、不強求眼神接觸——這些是合理調適，而非縱容。"),
      p(VOLUNTEER_CTA_ZH),
    ],
  },
  {
    slug: "charge-syndrome-explained",
    category: "education",
    status: "published",
    published_at: "2024-11-20T00:00:00.000Z",
    is_featured: false,
    tags: ["education", "basics"],
    author: "Love 21 Foundation",
    reading_time_minutes: 3,
    title_en: "CHARGE Syndrome, explained",
    excerpt_en:
      "A rare genetic condition whose name is an acronym for the features clinicians first grouped together.",
    cover_alt_en: "A one-to-one support session at the centre",
    body_en: [
      p("CHARGE Syndrome is a rare genetic condition. The name is an acronym for the cluster of features clinicians originally grouped together, including coloboma, heart defects, and ear abnormalities."),
      p("Combined hearing and vision differences are common, which makes communication support the first thing to get right rather than an afterthought."),
      p("As with every condition on this page, the range is wide and the diagnosis predicts far less than people assume."),
      p(VOLUNTEER_CTA_EN),
    ],
  },
  {
    slug: "person-first-or-identity-first-language",
    category: "education",
    status: "published",
    published_at: "2025-02-06T00:00:00.000Z",
    is_featured: false,
    tags: ["education", "language"],
    author: "Love 21 Foundation",
    reading_time_minutes: 2,
    title_en: "Person-first or identity-first? Ask.",
    excerpt_en:
      "\"Person with autism\" and \"autistic person\" are both correct, depending entirely on who you are talking to.",
    cover_alt_en: "Two members talking during a break",
    body_en: [
      p("Person-first language says \"a person with autism\". Identity-first says \"an autistic person\". Both are defended thoughtfully by the people they describe."),
      p("Broadly, much of the autistic community prefers identity-first, and many Down syndrome families prefer person-first. Neither is a rule, and getting it wrong is not a moral failure."),
      h("The usable answer"),
      p("Ask, then use what the person tells you. That is the whole protocol, and it outperforms memorising a preferred-terms list."),
      p(VOLUNTEER_CTA_EN),
    ],
  },
  {
    slug: "what-to-expect-as-a-first-time-volunteer",
    category: "education",
    status: "published",
    published_at: "2025-07-01T00:00:00.000Z",
    is_featured: true,
    tags: ["education", "volunteering"],
    author: "Love 21 Foundation",
    reading_time_minutes: 3,
    title_en: "What to expect as a first-time volunteer",
    title_zh: "第一次當義工：你可以預期甚麼",
    excerpt_en:
      "No experience, no qualifications, and no need to know the right thing to say. Here is the actual shape of a session.",
    excerpt_zh: "無需經驗、無需資格，也不必知道該說甚麼才對。以下是課堂的實際流程。",
    cover_alt_en: "New volunteers being introduced at the start of a session",
    cover_alt_zh: "新義工在課堂開始時被介紹給大家",
    body_en: [
      p("The most common reason people give for not volunteering is worrying they will say the wrong thing. It is a reasonable worry and it is not a good reason to stay away."),
      h("The shape of a session"),
      p("You arrive, someone introduces you, and you join an activity already running. You are not asked to lead anything on your first visit. Sessions run about two hours."),
      h("What is actually required"),
      p("Turning up, and being willing to be bad at bocce in public. Staff handle anything requiring training."),
      p(VOLUNTEER_CTA_EN),
    ],
    body_zh: [
      p("人們不當義工最常見的理由，是擔心自己會說錯話。這擔心可以理解，但不足以成為卻步的理由。"),
      h("課堂的流程"),
      p("你到達後會有人介紹你，然後你加入一項正在進行的活動。第一次來不會要求你帶領任何環節。課堂大約兩小時。"),
      h("實際需要的條件"),
      p("出現，以及願意在人前玩得很爛。任何需要專業訓練的事情由職員處理。"),
      p(VOLUNTEER_CTA_ZH),
    ],
  },

  // ---------------------------------------------------------------- reports
  {
    slug: "annual-report-2024-25",
    category: "report",
    status: "published",
    published_at: "2025-09-30T00:00:00.000Z",
    is_featured: false,
    tags: ["report"],
    author: "Love 21 Foundation",
    reading_time_minutes: 1,
    attachment_url: "https://example.org/love21/annual-report-2024-25.pdf",
    title_en: "Annual Report 2024–25",
    title_zh: "2024–25 年度報告",
    excerpt_en: "490 families, 6,859 sessions, 86% of spend going directly to programmes.",
    excerpt_zh: "490 個家庭、6,859 節課堂，86% 支出直接用於服務計劃。",
    cover_alt_en: "Cover of the Love 21 annual report 2024-25",
    cover_alt_zh: "Love 21 2024–25 年度報告封面",
    body_en: [
      p("The full report is available as a download. The headline figures:"),
      stat("490", "families served", "2024–25"),
      stat("6,859", "free sessions offered", "2024–25"),
      stat("86%", "of spend on programmes", "2024–25"),
      stat("30%", "year-on-year growth", "vs 2023–24"),
    ],
    body_zh: [
      p("完整報告可供下載。主要數字如下："),
      stat("490", "受惠家庭", "2024–25"),
      stat("6,859", "免費課堂節數", "2024–25"),
      stat("86%", "直接用於服務計劃的支出", "2024–25"),
      stat("30%", "按年增長", "相較 2023–24"),
    ],
  },
  {
    slug: "annual-report-2023-24",
    category: "report",
    status: "published",
    published_at: "2024-09-30T00:00:00.000Z",
    is_featured: false,
    tags: ["report"],
    author: "Love 21 Foundation",
    reading_time_minutes: 1,
    attachment_url: "https://example.org/love21/annual-report-2023-24.pdf",
    title_en: "Annual Report 2023–24",
    excerpt_en: "The year the centre burned down and reopened larger.",
    cover_alt_en: "Cover of the Love 21 annual report 2023-24",
    body_en: [
      p("The full report is available as a download. This is the year covering the January fire and the October reopening in San Po Kong."),
      stat("377", "families served", "2023–24"),
      stat("5,280", "free sessions offered", "2023–24"),
    ],
  },
];

module.exports = { articles };
