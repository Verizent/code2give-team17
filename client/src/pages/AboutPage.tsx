import React, { useEffect, useMemo, useRef, useState } from 'react'
import { SkipLink } from '@/components/skip-link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useSite } from '@/components/site-provider'
import { BrandPatternBand } from '@/components/brand-pattern'
import { cn } from '@/lib/utils'

const T = (en: string, zh: string) => ({ en, zh })

const HERO_IMAGES = [
  '/brand/story.jpg',
  '/brand/sports.jpeg',
  '/brand/activity.jpg',
]

const HERO_STATS = [
  { value: '6,859', label: T('Sessions delivered', '已提供課堂') },
  { value: '600+', label: T('Families supported', '支援家庭') },
  { value: '50+', label: T('Activities on offer', '提供活動') },
]

const ACHIEVEMENTS = [
  { icon: '🏅', title: T('Asian Para-Karate Championships', '亞洲殘疾人空手道錦標賽'), body: T('Medals won by our members on the regional stage.', '會員在區域賽事中奪得獎牌。') },
  { icon: '🏢', title: T('Nearly 30 Members', '近 30 位會員'), body: T('Employed and trained through our employment-readiness programme, with many going on to work at outside companies.', '透過就業準備計劃獲聘及培訓，當中不少人其後於機構任職。') },
  { icon: '🔥', title: T('Phoenix Year', '鳳凰之年'), body: T('Rebuilt and reopened with expanded capacity after the January 2023 San Po Kong fire, thanks to more than 50 partner companies.', '在 2023 年 1 月新蒲崗火災後，於逾 50 間合作企業支持下重建，並以更大容量重新開幕。') },
  { icon: '🚣', title: T('Dragon Boat Debut', '龍舟首秀'), body: T('Members completed a six-week training programme before racing together in open water for the first time.', '會員完成六週訓練課程後，首次於公開水域一同參賽。') },
]

const MILESTONES = [
  { year: '2017', title: T('A simple question starts a movement.', '一個簡單問題，開啟一場行動。'), body: T('Love 21 Foundation is founded by Jeff Rotmeyer, alongside our sister charity ImpactHK.', 'Jeff Rotmeyer 創立 Love 21 基金會，並與姊妹慈善機構 ImpactHK 同行。'), image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1500&q=85' },
  { year: '2021', title: T('Wellbeing becomes a whole-family journey.', '健康成為全家人的旅程。'), body: T('We launch comprehensive one-on-one nutrition support alongside our sports classes.', '我們在運動課程以外推出全面的一對一營養支援。'), image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1500&q=85' },
  { year: '2023', title: T('Our community helps us rebuild.', '社群攜手協助我們重建。'), body: T('After a fire damages our original San Po Kong centre, Hong Kong comes together. We reopen in October with expanded capacity.', '新蒲崗原有中心因火災受損後，香港社群攜手支持我們。我們於十月重新開幕，服務容量大幅提升。'), image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1500&q=85' },
  { year: '2025', title: T('Growing to meet the need.', '成長以回應需要。'), body: T('Our first-ever Charity Raffle launches to meet growing demand for our services.', '我們首次推出慈善抽獎活動，以回應日益增加的服務需求。'), image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1500&q=85' },
  { year: '2026', title: T('Beyond limits, together.', '攜手超越界限。'), body: T('On 12 June, our Beyond Limits Banquet at Lippo Chiuchow Restaurant brought supporters together for member dance and magic performances, with Nathan Leung co-hosting alongside our founder — raising funds for fitness, ABA therapy, and counselling sessions.', '6 月 12 日，我們的 Beyond Limits 晚宴假力寶潮州酒樓舉行，支持者共聚一堂，欣賞會員舞蹈及魔術表演，並由 Nathan Leung 與創辦人聯合主持，為健身、應用行為分析治療及輔導服務籌款。'), image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1500&q=85' },
]

const BOARD = [
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

const PROGRAMMES = [
  { id: 'sports', icon: '✦', eyebrow: T('Programme 01', '活動 01'), title: T('Sports', '運動'), body: T('Our sports programme is designed without limitations — a comprehensive range of activities, from football and basketball to surfing and trampoline, alongside strength training, coordination, and mental health support. We run 8+ weekly classes and 50+ activities in total.', '我們的運動計劃不設界限，提供足球、籃球、衝浪、彈床，以及力量、協調和心理健康支援等多元活動。'), action: T('Explore programme', '探索活動'), href: '/programmes/sports', image: '/brand/sports.jpeg' },
  { id: 'nutrition', icon: '●', eyebrow: T('Programme 02', '活動 02'), title: T('Nutrition', '營養'), body: T('Sport alone is not enough to meaningfully extend life expectancy. Our nutrition programme pairs one-on-one guidance with regular cooking and food-prep lessons, so families can build lasting, healthy habits together.', '單靠運動不足以顯著延長預期壽命。我們的營養計劃結合一對一指導、烹飪及食材準備課堂，讓家庭建立長久健康習慣。'), action: T('Explore programme', '探索活動'), href: '/programmes/nutrition', image: '/brand/nutrition.jpeg' },
  { id: 'family', icon: '♥', eyebrow: T('Programme 03', '活動 03'), title: T('Family', '家庭'), body: T('Family is central to everything we do. Parents play a huge role in our classes, and we offer specialty sessions just for them, alongside plenty of chances to join their children’s activities.', '家庭是我們所有工作的核心。家長在課堂中擔當重要角色，我們亦提供專為他們而設的課堂及參與子女活動的機會。'), action: T('Explore programme', '探索活動'), href: '/programmes/family', image: '/brand/family.jpg' },
  { id: 'csr', icon: '◎', eyebrow: T('Programme 04', '活動 04'), title: T('Corporate Social Responsibility', '企業社會責任'), body: T('Our beneficiaries are rarely seen and often misunderstood. Our CSR programme brings your team into a circuit-training session alongside our members — an afternoon that shows just how much ability this community has.', '我們的服務對象鮮有被看見，也常被誤解。我們的企業社會責任計劃讓團隊與會員一起參與循環訓練，親身感受這個社群的無限能力。'), action: T('Partner with us', '與我們合作'), href: 'mailto:jeff@love21foundation.com?subject=CSR%20programme', image: '/brand/csr.jpg' },
]

const GALLERY = [
  '/brand/activity.jpg',
  '/brand/class.jpg',
  '/brand/csr.jpg',
  '/brand/family.jpg',
  '/brand/nutrition.jpeg',
]

const STATS = [
  { value: 600, prefix: '', suffix: '+', label: T('Families supported today', '現時支援的家庭') },
  { value: 350, prefix: '', suffix: '+', label: T('Families supported in 2023', '2023 年支援的家庭') },
  { value: 1000, prefix: '~', suffix: '', label: T('Free sessions provided monthly', '每月提供的免費課堂') },
  { value: 50, prefix: '', suffix: '+', label: T('Activities and programmes on offer', '提供的活動及課程') },
]

const QUOTES = [
  { quote: T('“Everybody deserves the opportunity to reach their full potential.”', '「每個人都應有機會發揮全部潛能。」'), by: T('Love 21 Foundation', 'Love 21 基金會') },
  { quote: T('“There’s a whole community that has come together. I’m very proud to be part of that community.”', '「整個社群都凝聚起來。我非常自豪能成為其中一員。」'), by: T('Carmel Armstrong, Chief Operating Officer', 'Carmel Armstrong，營運總監') },
]

const PARTNERS = ['JEB', 'Bluestone Management', 'Team Build Events', 'Argyll Scott', 'Nakama Global']

function useText(locale: string) { return (copy: { en: string; zh: string }) => locale === 'en' ? copy.en : copy.zh }

function CountUp({ stat }: { stat: (typeof STATS)[number] }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement | null>(null)
  const { locale } = useSite(); const tx = useText(locale)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) return; const start = performance.now(); const animate = (now: number) => { const p = Math.min((now - start) / 1150, 1); setCount(Math.round(stat.value * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(animate) }; requestAnimationFrame(animate); observer.disconnect() }, { threshold: 0.5 })
    observer.observe(el); return () => observer.disconnect()
  }, [stat.value])
  return <div ref={ref}><div className="font-display text-4xl font-bold text-navy sm:text-6xl">{stat.prefix}{count.toLocaleString()}{stat.suffix}</div><p className="mt-2 text-sm text-navy/70">{tx(stat.label)}</p></div>
}

export function AboutPage() {
  const { locale } = useSite(); const tx = useText(locale)
  const [hero, setHero] = useState(0); const [activeProgramme, setActiveProgramme] = useState(0); const [activeSection, setActiveSection] = useState(0); const [quote, setQuote] = useState(0); const [lightbox, setLightbox] = useState<number | null>(null); const [progress, setProgress] = useState(0)
  const programmeRefs = useRef<(HTMLElement | null)[]>([]); const pageRefs = useRef<(HTMLElement | null)[]>([])
  // Nav is ordered by visitor priority (what is this → why care → how to help), not by page position.
  const pageNav = useMemo(() => [T('Impact', '影響力'), T('Stories', '故事'), T('Programmes', '活動'), T('Leadership', '領導團隊'), T('Gallery', '相片'), T('Support', '支持我們')], [])

  useEffect(() => {
    const timer = window.setInterval(() => setHero((i) => (i + 1) % HERO_IMAGES.length), 5200); const quoteTimer = window.setInterval(() => setQuote((i) => (i + 1) % QUOTES.length), 6500)
    const scroll = () => { const max = document.documentElement.scrollHeight - window.innerHeight; setProgress(max ? window.scrollY / max * 100 : 0) }; window.addEventListener('scroll', scroll, { passive: true }); scroll()
    const observer = new IntersectionObserver((entries) => { const target = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (target) setActiveProgramme(Number(target.target.getAttribute('data-programme'))) }, { threshold: [0.35, 0.6, 0.8] }); programmeRefs.current.forEach((el) => el && observer.observe(el))
    return () => { window.clearInterval(timer); window.clearInterval(quoteTimer); window.removeEventListener('scroll', scroll); observer.disconnect() }
  }, [])
  const scrollTo = (index: number) => { setActiveSection(index); pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  return <div className="min-h-screen overflow-x-hidden bg-white"><style>{'@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }'}</style><div className="fixed left-0 top-0 z-[60] h-1 bg-yellow" style={{ width: `${progress}%` }} /><SkipLink /><SiteHeader /><main id="main">

    {/* HERO */}
    <section className="relative flex min-h-[82vh] items-end overflow-hidden bg-navy px-5 pb-16 pt-32 sm:min-h-[90vh] sm:px-10 sm:pb-24 lg:px-16">
      {HERO_IMAGES.map((image, index) => <div key={image} aria-hidden="true" className={cn('absolute inset-0 bg-cover bg-center transition-all duration-[1800ms] ease-out', hero === index ? 'scale-105 opacity-100' : 'scale-100 opacity-0')} style={{ backgroundImage: `url('${image}')` }} />)}
      <div className="absolute inset-0 bg-gradient-to-r from-red/90 via-red/65 to-navy/30" />
      <div className="relative mx-auto w-full max-w-[1120px]">
        <p className="kicker text-yellow">{tx(T('Love 21 Foundation', 'Love 21 基金會'))}</p>
        <h1 className="mt-4 max-w-4xl font-display text-[clamp(3.4rem,9vw,8rem)] font-semibold leading-[0.86] tracking-tight text-white">{tx(T('Empowering every journey.', '讓每段旅程都充滿力量。'))}</h1>
        <p className="mt-5 max-w-xl text-lg font-semibold uppercase tracking-[0.14em] text-yellow">{tx(T('Sport. Nutrition. Family.', '運動。營養。家庭。'))}</p>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/85">{tx(T('Helping every person with Down syndrome and autism reach their full potential.', '幫助每一位唐氏綜合症及自閉症人士發揮全部潛能。'))}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/volunteer" className="rounded-full bg-yellow px-6 py-3 text-sm font-bold text-navy">{tx(T('Volunteer', '成為義工'))}</a>
          <a href="/donate" className="rounded-full border border-white/50 px-6 py-3 text-sm font-bold text-white hover:bg-white hover:text-navy">{tx(T('Donate', '捐款'))}</a>
        </div>
        <div className="mt-7 flex gap-2">{HERO_IMAGES.map((image, index) => <button key={image} type="button" aria-label={`${index + 1}`} onClick={() => setHero(index)} className={cn('h-1 rounded-full transition-all', hero === index ? 'w-10 bg-yellow' : 'w-5 bg-white/50')} />)}</div>
      </div>
    </section>

    {/* IMPACT BAR — sits right under the cover, spans full width */}
    <div className="border-b border-navy/10 bg-navy px-5 py-5 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-x-10 gap-y-3 text-white/90 sm:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {HERO_STATS.map((stat) => <div key={stat.value} className="flex items-baseline gap-2"><span className="font-display text-2xl font-bold text-yellow">{stat.value}</span><span className="text-sm">{tx(stat.label)}</span></div>)}
        </div>
        <span className="text-xs uppercase tracking-[0.14em] text-white/50">{tx(T('Updated moments ago', '剛剛更新'))}</span>
      </div>
    </div>

    <nav aria-label={tx(T('Page sections', '頁面部分'))} className="sticky top-14 z-30 border-y border-navy/10 bg-white/95 backdrop-blur sm:top-[72px]"><div className="no-scrollbar mx-auto flex max-w-[1120px] gap-2 overflow-x-auto px-4 py-3 sm:px-8">{pageNav.map((item, index) => <button key={item.en} type="button" onClick={() => scrollTo(index)} className={cn('min-h-11 shrink-0 rounded-full px-5 text-sm font-bold', activeSection === index ? 'bg-navy text-white' : 'text-navy hover:bg-yellow/30')}>0{index + 1} {tx(item)}</button>)}</div></nav>

    {/* IMPACT NUMBERS */}
    <section ref={(el) => { pageRefs.current[0] = el }} className="px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
      <div className="mx-auto max-w-[1120px]">
        <p className="kicker text-navy/60">{tx(T('Our impact', '我們的影響力'))}</p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-navy sm:text-6xl">{tx(T('The numbers tell part of the story.', '數字訴說故事的一部分。'))}</h2>
        <div className="mt-10 grid gap-8 rounded-md bg-navy/5 p-8 text-center sm:grid-cols-2 lg:grid-cols-4 sm:p-12">{STATS.map((stat) => <CountUp key={stat.value} stat={stat} />)}</div>
        <div className="mt-8 flex flex-col gap-5 rounded-md border border-navy/10 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-lg font-bold text-navy">{tx(T('Read our full Annual Report', '閱讀完整年報'))}</h3><p className="mt-1 text-navy/75">{tx(T('Every number behind our programmes, spelled out in detail.', '深入了解每項活動背後的數字。'))}</p></div>
          <a href="https://love21foundation.com/wp-content/uploads/2026/04/Annualreport_final.pdf" className="inline-flex shrink-0 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white">{tx(T('Download PDF', '下載 PDF'))} →</a>
        </div>
      </div>
    </section>

    {/* COMMUNITY ACHIEVEMENTS */}
    <section className="bg-navy px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
      <div className="mx-auto max-w-[1120px]">
        <p className="kicker text-yellow">{tx(T('Community achievements', '社群成就'))}</p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-white sm:text-6xl">{tx(T('Milestones our members are proud of.', '會員引以為傲的里程碑。'))}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENTS.map((item) => (
            <div key={item.title.en} className="rounded-md border border-white/15 bg-white/5 p-6">
              <span className="text-3xl">{item.icon}</span>
              <h3 className="mt-4 font-display text-xl font-semibold text-white">{tx(item.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{tx(item.body)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* PARTNER TESTIMONIALS / CSR */}
    <section className="bg-paper px-5 py-16 sm:px-10 sm:py-20 lg:px-16">
      <div className="mx-auto grid max-w-[1120px] gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-navy/10 bg-white p-7 sm:p-10">
          <p className="kicker text-navy/60">{tx(T('What our partners say', '合作夥伴分享'))}</p>
          <blockquote className="mt-5 text-lg italic leading-relaxed text-navy/85">{tx(T('“Our experience with Love 21 has been amazing. Jeff and Carmel walked us through the challenges this community faces, then we joined a circuit-training session alongside members — an experience that will stay with us for a long time.”', '「我們在 Love 21 的體驗非常難忘。Jeff 和 Carmel 讓我們了解社群面對的挑戰，其後我們與會員一起參與循環訓練，這是一段令我們長久難忘的經歷。」'))}</blockquote>
          <p className="mt-4 text-sm font-bold text-navy/60">Chaim — Argyll Scott</p>
          <blockquote className="mt-7 text-lg italic leading-relaxed text-navy/85">{tx(T('“Volunteering at Love 21 was an eye-opening experience, with some delightful members and a really cool space! We loved being part of such an amazing community.”', '「在 Love 21 做義工令人大開眼界；會員令人喜愛，空間亦十分出色！我們很高興成為這個美好社群的一分子。」'))}</blockquote>
          <p className="mt-4 text-sm font-bold text-navy/60">Laura — Nakama Global</p>
        </div>
        <div className="rounded-md bg-yellow p-7 sm:p-10">
          <p className="kicker text-navy/60">{tx(T('Corporate Social Responsibility', '企業社會責任'))}</p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-navy">{tx(T('Interested in a CSR Day?', '有興趣舉辦 CSR 日嗎？'))}</h2>
          <p className="mt-4 leading-relaxed text-navy/80">{tx(T('Bring your team into our community for a meaningful, hands-on experience. Contact our Founder/CEO to learn more.', '讓你的團隊走進我們的社群，參與有意義的親身體驗。歡迎聯絡我們的創辦人／行政總裁了解更多。'))}</p>
          <a href="mailto:jeff@love21foundation.com" className="mt-7 inline-flex rounded-full bg-navy px-6 py-3 text-sm font-bold text-white">jeff@love21foundation.com</a>
        </div>
      </div>
    </section>

    {/* OUR STORY + TIMELINE */}
    <section ref={(el) => { pageRefs.current[1] = el }} className="bg-[#f8f7f3] px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
      <div className="mx-auto max-w-[1120px]">
        <p className="kicker text-navy/60">{tx(T('Our story', '我們的故事'))}</p>
        <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight text-navy sm:text-6xl">{tx(T('A story written together.', '一個共同書寫的故事。'))}</h2>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-navy/80">{tx(T('Love 21 is a charity dedicated to empowering the Down syndrome and autistic community in Hong Kong through sport, nutrition, and holistic support programmes. It began with a simple, personal question: after losing a close friend far too young, our founder started asking why life expectancy in this community was so low in Hong Kong — and found almost no answers. Love 21 exists to change that, one family at a time.', 'Love 21 是一個慈善機構，透過運動、營養和全面支援活動，為香港唐氏綜合症及自閉症社群賦能。它始於一個簡單而個人的問題：為甚麼這個社群在香港的預期壽命如此低？Love 21 的存在，是為了逐一家庭帶來改變。'))}</p>
        <div className="mt-14 space-y-16">
          {MILESTONES.map((milestone, index) => (
            <article key={milestone.year} className="grid items-center gap-7 lg:grid-cols-2 lg:gap-14">
              <div className={cn('overflow-hidden rounded-md', index % 2 ? 'lg:order-2' : '')}><img src={milestone.image} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-105" /></div>
              <div className={index % 2 ? 'lg:order-1' : ''}>
                <div className="flex items-center gap-4"><span className="h-3 w-3 rounded-full bg-yellow" /><span className="font-display text-4xl font-semibold text-red">{milestone.year}</span></div>
                <h3 className="mt-4 font-display text-3xl font-semibold text-navy">{tx(milestone.title)}</h3>
                <p className="mt-4 max-w-lg leading-relaxed text-navy/75">{tx(milestone.body)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>

    {/* LEADERSHIP */}
    <section ref={(el) => { pageRefs.current[3] = el }} className="px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
      <div className="mx-auto max-w-[1120px]">
        <p className="kicker text-navy/60">{tx(T('The people behind the purpose', '使命背後的團隊'))}</p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-navy sm:text-6xl">{tx(T('Leadership', '領導團隊'))}</h2>
        <p className="mt-5 max-w-2xl leading-relaxed text-navy/75">{tx(T('Our Board of Directors is comprised of caring individuals from diverse professional backgrounds in Hong Kong, who bring their various talents and passion to support and strengthen Love 21.', '我們的董事會由來自香港不同專業背景的關懷人士組成，以各自的才能和熱誠支持 Love 21。'))}</p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {BOARD.map((member) => (
            <div key={member.name} className="group overflow-hidden rounded-md border border-navy/10 bg-white shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-md">
              <div className="aspect-[4/3] w-full overflow-hidden bg-navy/10">
                <img src={member.image} alt={member.name} className={cn('h-full w-full object-cover transition-transform duration-500 group-hover:scale-105', member.position || 'object-center')} />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-navy underline decoration-yellow decoration-2 underline-offset-4 decoration-transparent transition-colors group-hover:decoration-yellow">{member.name}</h3>
                <p className="mt-1 text-sm text-navy/60">{tx(T('Board of Directors', '董事會'))}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* PROGRAMMES */}
    <section ref={(el) => { pageRefs.current[2] = el }} className="relative bg-navy">
      <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(#f4c542 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      <div className="relative px-5 pb-6 pt-16 sm:px-10 sm:pt-24 lg:px-16"><div className="mx-auto max-w-[1120px]"><p className="kicker text-yellow">{tx(T('At the heart of Love 21', 'Love 21 的核心'))}</p><h2 className="mt-3 font-display text-4xl font-semibold text-white sm:text-6xl">{tx(T('Our programmes', '我們的活動'))}</h2></div></div>
      <aside className="pointer-events-none absolute right-7 top-[48vh] z-20 hidden -translate-y-1/2 lg:block"><ul className="space-y-3">{PROGRAMMES.map((programme, index) => <li key={programme.id}><button type="button" onClick={() => programmeRefs.current[index]?.scrollIntoView({ behavior: 'smooth' })} className="pointer-events-auto group flex items-center gap-3"><span className={cn('rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white transition-all', activeProgramme === index ? 'bg-white/20 opacity-100' : 'opacity-0 group-hover:opacity-100')}>{tx(programme.title)}</span><span className={cn('rounded-full border border-white', activeProgramme === index ? 'h-3 w-3 bg-yellow' : 'h-2.5 w-2.5')} /></button></li>)}</ul></aside>
      {PROGRAMMES.map((programme, index) => <section key={programme.id} data-programme={index} ref={(el) => { programmeRefs.current[index] = el }} className="relative flex min-h-screen items-end overflow-hidden px-5 py-16 sm:px-10 sm:py-20 lg:px-16"><div aria-hidden="true" className={cn('absolute -inset-[5%] bg-cover bg-center bg-fixed transition-transform duration-[1800ms]', activeProgramme === index ? 'scale-105' : 'scale-100')} style={{ backgroundImage: `url('${programme.image}')` }} /><div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/55 to-navy/20" /><div className="relative mx-auto w-full max-w-[1120px]"><span className="inline-flex h-12 w-12 animate-bounce items-center justify-center rounded-full bg-yellow text-xl text-navy [animation-duration:3s]">{programme.icon}</span><p className="mt-6 kicker text-yellow">{tx(programme.eyebrow)}</p><h3 className="mt-3 max-w-4xl font-display text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.9] text-white">{tx(programme.title)}</h3><p className="mt-6 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">{tx(programme.body)}</p><a href={programme.href} className="mt-8 inline-flex items-center gap-3 border-b-2 border-yellow pb-2 text-sm font-bold uppercase tracking-[0.12em] text-white hover:text-yellow">{tx(programme.action)} <span>→</span></a></div></section>)}
    </section>

    {/* COMMUNITY GALLERY */}
    <section ref={(el) => { pageRefs.current[4] = el }} className="bg-[#f8f7f3] px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
      <div className="mx-auto max-w-[1120px]">
        <p className="kicker text-navy/60">{tx(T('In pictures', '照片故事'))}</p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-navy sm:text-6xl">{tx(T('Our community in motion', '我們的活力社群'))}</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">{GALLERY.map((image, index) => <button key={image} type="button" onClick={() => setLightbox(index)} className={cn('group relative overflow-hidden rounded-md', index === 0 ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-square')}><img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><span className="absolute inset-0 flex items-center justify-center bg-navy/0 text-sm font-bold uppercase tracking-[0.1em] text-white opacity-0 transition-all group-hover:bg-navy/40 group-hover:opacity-100">{tx(T('View photo', '查看照片'))}</span></button>)}</div>
      </div>
    </section>

    {/* QUOTE BAND */}
    <section className="relative overflow-hidden bg-navy px-5 py-20 text-center sm:px-10 sm:py-28 lg:px-16">
      <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url('${GALLERY[0]}')` }} />
      <div className="relative mx-auto max-w-4xl">
        <p className="text-6xl text-yellow">“</p>
        <blockquote className="mt-3 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-semibold leading-[0.96] text-white">{tx(QUOTES[quote].quote)}</blockquote>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.14em] text-yellow">{tx(QUOTES[quote].by)}</p>
        <div className="mt-7 flex justify-center gap-2">{QUOTES.map((item, index) => <button key={item.by.en} type="button" onClick={() => setQuote(index)} className={cn('h-2 rounded-full', quote === index ? 'w-8 bg-yellow' : 'w-2 bg-white/40')} />)}</div>
      </div>
    </section>

    {/* PARTNER LOGOS */}
    <section className="border-y border-navy/10 bg-white px-5 py-14 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[1120px]">
        <p className="kicker text-center text-navy/60">{tx(T('Our partners', '合作夥伴'))}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {PARTNERS.map((partner) => (
            <span key={partner} className="rounded-full border border-navy/20 px-5 py-2 text-sm font-bold text-navy/50 grayscale transition-all hover:border-navy/40 hover:text-navy hover:grayscale-0">{partner}</span>
          ))}
        </div>
      </div>
    </section>

    <BrandPatternBand variant="yellow" className="easy-hide" />

    {/* FINAL CTA */}
    <section ref={(el) => { pageRefs.current[5] = el }} className="relative overflow-hidden bg-navy px-5 py-20 sm:px-10 sm:py-28 lg:px-16">
      <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url('${HERO_IMAGES[2]}')` }} />
      <div className="absolute inset-0 bg-navy/70" />
      <div className="relative mx-auto flex max-w-[1120px] flex-col justify-between gap-9 sm:flex-row sm:items-end">
        <div><p className="kicker text-yellow">{tx(T('Join the story', '加入故事'))}</p><h2 className="mt-3 max-w-3xl font-display text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.9] text-white">{tx(T('Ready to make a difference?', '準備好帶來改變嗎？'))}</h2></div>
        <div className="flex flex-wrap gap-3">
          <a href="/volunteer" className="rounded-full bg-yellow px-6 py-3 text-sm font-bold text-navy">{tx(T('Volunteer', '成為義工'))}</a>
          <a href="/donate" className="rounded-full border border-white/50 px-6 py-3 text-sm font-bold text-white hover:bg-white hover:text-navy">{tx(T('Donate', '捐款'))}</a>
          <a href="mailto:jeff@love21foundation.com" className="rounded-full border border-white/50 px-6 py-3 text-sm font-bold text-white hover:bg-white hover:text-navy">{tx(T('Partner', '合作'))}</a>
        </div>
      </div>
    </section>

  </main>{lightbox !== null && <div role="dialog" aria-modal="true" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-5" onClick={() => setLightbox(null)}><button type="button" onClick={() => setLightbox(null)} className="absolute right-5 top-5 text-sm font-bold text-white">× {tx(T('Close', '關閉'))}</button><img src={GALLERY[lightbox]} alt="" className="max-h-[85vh] max-w-[85vw] object-contain" onClick={(event) => event.stopPropagation()} /></div>}<SiteFooter /></div>
}

export default AboutPage
