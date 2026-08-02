import React, { useEffect, useMemo, useRef, useState } from 'react'
import { SkipLink } from '@/components/skip-link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useSite } from '@/components/site-provider'
import { BrandPatternBand } from '@/components/brand-pattern'
import { markEducationRead } from '@/features/me/education'
import { cn } from '@/lib/utils'

type Article = {
  id: string
  category_en: string
  category_zh: string
  headline_en: string
  headline_zh: string
  summary_en: string
  summary_zh: string
  date_en: string
  date_zh: string
  tags: string[]
  image: string
  featured?: boolean
  cta_label_en?: string
  cta_label_zh?: string
  cta_href?: string
}

const T = (en: string, zh: string) => ({ en, zh })

const HERO_SLIDES = [
  { image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=2400&q=85', alt: 'A team celebrating after sport' },
  { image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=2400&q=85', alt: 'People enjoying a basketball activity' },
  { image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2400&q=85', alt: 'Friends together outdoors' },
  { image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=2400&q=85', alt: 'Volunteers working together' },
]

const ARTICLES: Article[] = [
  { id: 'banquet', category_en: 'Events', category_zh: '活動', headline_en: 'Beyond Limits Banquet — Friday, 12 June 2026', headline_zh: 'Beyond Limits 晚宴 — 2026 年 6 月 12 日', summary_en: 'Join us for a special fundraising dinner at Lippo Chiuchow Restaurant, Admiralty. An evening of member performances, dance, magic, and community.', summary_zh: '歡迎參加位於金鐘利寶閣的特別籌款晚宴，欣賞會員表演、舞蹈、魔術及社群交流。', date_en: '12 June 2026', date_zh: '2026 年 6 月 12 日', tags: ['Fundraising', 'Community'], featured: true, cta_label_en: 'Enquire with Patricia', cta_label_zh: '聯絡 Patricia', cta_href: 'mailto:patricia@love21foundation.com', image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1800&q=85' },
  { id: 'raffle', category_en: 'Fundraising', category_zh: '籌款', headline_en: 'Charity Raffle 2025: 97 Prizes, Over HK$200,000 in Value', headline_zh: '2025 慈善抽獎：97 份獎品，總值逾港幣 20 萬元', summary_en: 'Our first-ever Charity Raffle helps fund nearly 1,000 free sessions each month for more than 600 families.', summary_zh: '首屆慈善抽獎為超過 600 個家庭每月近 1,000 節免費活動籌募經費。', date_en: 'November 2025', date_zh: '2025 年 11 月', tags: ['Fundraising', 'Raffle'], cta_label_en: 'Download prize list', cta_label_zh: '下載獎品名單', cta_href: 'https://love21foundation.com/wp-content/uploads/2025/11/Love-21-Raffle2025_Prize-Sponsorship-Final-prize-list-for-upload.pdf', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=85' },
  { id: 'karate', category_en: 'Achievements', category_zh: '成就', headline_en: 'Love 21 Athletes Shine at the Asian Para-Karate Championships', headline_zh: 'Love 21 運動員於亞洲殘疾人空手道錦標賽大放異彩', summary_en: 'Congratulations to our athletes who won medals representing Hong Kong in Bali — another proud moment on the international stage.', summary_zh: '恭喜我們的運動員在峇里代表香港奪得獎牌，於國際舞台再創令人自豪的時刻。', date_en: 'April 2026', date_zh: '2026 年 4 月', tags: ['Sports', 'Karate'], image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1200&q=85' },
  { id: 'dragonboat', category_en: 'Community Impact', category_zh: '社區影響', headline_en: 'Dragon Boat Team Races to Victory in Open Water', headline_zh: '龍舟隊於公開水域划向勝利', summary_en: 'Love 21 teens trained for six weeks before competing in a dragon boat race, chanting “friendship first, losing second.”', summary_zh: 'Love 21 青少年經過六星期訓練後參加龍舟賽，以「友誼第一，輸贏第二」的精神迎戰。', date_en: 'June 2026', date_zh: '2026 年 6 月', tags: ['Sports', 'Inclusion'], image: 'https://images.unsplash.com/photo-1560314318-980aec6ad6dc?auto=format&fit=crop&w=1200&q=85' },
  { id: 'employment', category_en: 'Program Highlight', category_zh: '活動焦點', headline_en: 'Preparing Our Community for the Workplace', headline_zh: '為社群準備職場新一頁', summary_en: 'Love 21 is changing the narrative around employment through training and advocacy for young people with Down syndrome and autism.', summary_zh: 'Love 21 透過培訓和倡議，改變唐氏綜合症及自閉症青年在就業上的故事。', date_en: 'March 2026', date_zh: '2026 年 3 月', tags: ['Employment', 'Advocacy'], image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85' },
  { id: 'nutrition', category_en: 'Program Highlight', category_zh: '活動焦點', headline_en: 'Nurturing Wellness Through One-on-One Nutrition', headline_zh: '透過一對一營養指導培養健康生活', summary_en: 'Our comprehensive nutrition programme pairs personal support with practical learning, helping members build healthy habits for life.', summary_zh: '全面的營養計劃結合個人支援與實用學習，協助會員建立一生受用的健康習慣。', date_en: 'February 2026', date_zh: '2026 年 2 月', tags: ['Nutrition', 'Wellbeing'], image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85' },
  { id: 'counselling', category_en: 'Program Highlight', category_zh: '活動焦點', headline_en: 'New Counselling Support Now Available for Parents', headline_zh: '現已為家長提供全新輔導支援', summary_en: 'Empowering our community means supporting every part of the family. Our services now include counselling support for parents.', summary_zh: '為社群賦能，意味著支持每一個家庭成員。我們現已為家長提供輔導支援。', date_en: 'January 2026', date_zh: '2026 年 1 月', tags: ['Counselling', 'Family'], image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=85' },
]

const IMPACT_STATS = [
  { value: 1000, prefix: '~', suffix: '', label: T('Free sessions provided monthly', '每月提供的免費課堂') },
  { value: 600, prefix: '', suffix: '+', label: T('Families supported', '支援的家庭') },
  { value: 8, prefix: '', suffix: '+', label: T('Weekly sport classes', '每週運動課程') },
]

const GALLERY = [
  { image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=85', alt: 'Friends sharing a happy moment' },
  { image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=85', alt: 'A celebration with friends' },
  { image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1400&q=85', alt: 'Sports activity' },
  { image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=85', alt: 'Fresh nutritious food' },
  { image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1400&q=85', alt: 'Volunteers in the community' },
  { image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=85', alt: 'Community friends outdoors' },
]

const QUOTES = [
  { quote: T('“Love 21 changed our lives. It gave our family a community, a place to grow, and something to look forward to every week.”', '「Love 21 改變了我們的生活。它給予我們家庭一個社群、成長的空間，以及每星期期待的事情。」'), by: T('Parent in the Love 21 community', 'Love 21 社群家長') },
  { quote: T('“The joy, confidence, and friendships our members build are the reason we do this work.”', '「會員建立的喜悅、自信和友誼，正是我們投入這項工作的原因。」'), by: T('Love 21 team', 'Love 21 團隊') },
]

const CATEGORY_ICONS: Record<string, string> = { all: '✦', Events: '✦', Fundraising: '♥', Achievements: '★', 'Community Impact': '◎', 'Program Highlight': '○', 活動: '✦', 籌款: '♥', 成就: '★', 社區影響: '◎', 活動焦點: '○' }

function useText(locale: string) {
  return (copy: { en: string; zh: string }) => (locale === 'en' ? copy.en : copy.zh)
}

function AnimatedStat({ value, prefix, suffix, label }: (typeof IMPACT_STATS)[number] & { label: { en: string; zh: string } }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement | null>(null)
  const { locale } = useSite()
  const tx = useText(locale)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      const start = performance.now()
      const frame = (now: number) => {
        const progress = Math.min((now - start) / 1100, 1)
        setCount(Math.round(value * (1 - Math.pow(1 - progress, 3))))
        if (progress < 1) requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
      observer.disconnect()
    }, { threshold: 0.4 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [value])

  return <div ref={ref}><div className="font-display text-3xl font-bold text-navy sm:text-5xl">{prefix}{count.toLocaleString()}{suffix}</div><div className="mt-2 text-xs text-navy/70 sm:text-sm">{tx(label)}</div></div>
}

export function NewsPage() {
  const { locale } = useSite()
  const tx = useText(locale)
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [heroIndex, setHeroIndex] = useState(0)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const heroTimer = window.setInterval(() => setHeroIndex((index) => (index + 1) % HERO_SLIDES.length), 5000)
    const quoteTimer = window.setInterval(() => setQuoteIndex((index) => (index + 1) % QUOTES.length), 6500)
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => { window.clearInterval(heroTimer); window.clearInterval(quoteTimer); window.removeEventListener('scroll', onScroll) }
  }, [])

  const categories = useMemo(() => {
    const key = locale === 'en' ? 'category_en' : 'category_zh'
    return ['all', ...Array.from(new Set(ARTICLES.map((article) => article[key])))]
  }, [locale])
  const featured = ARTICLES.find((article) => article.featured)
  const visible = ARTICLES.filter((article) => !article.featured).filter((article) => {
    const category = locale === 'en' ? article.category_en : article.category_zh
    const matchesTab = tab === 'all' || category === tab
    const haystack = `${article.headline_en} ${article.headline_zh} ${article.summary_en} ${article.summary_zh} ${article.tags.join(' ')}`.toLowerCase()
    return matchesTab && (!query.trim() || haystack.includes(query.trim().toLowerCase()))
  })

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <div className="fixed left-0 top-0 z-[60] h-1 bg-yellow transition-[width] duration-150" style={{ width: `${progress}%` }} />
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <section className="relative flex min-h-[78vh] items-end overflow-hidden bg-navy px-5 pb-16 pt-32 sm:min-h-[86vh] sm:px-10 sm:pb-24 lg:px-16">
          {HERO_SLIDES.map((slide, index) => <div key={slide.image} aria-hidden="true" className={cn('absolute inset-0 bg-cover bg-center transition-all duration-[1800ms] ease-out', heroIndex === index ? 'scale-105 opacity-100' : 'scale-100 opacity-0')} style={{ backgroundImage: `url('${slide.image}')` }} />)}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/60 to-navy/25" />
          <div className="relative mx-auto w-full max-w-[1120px]"><p className="kicker text-yellow">{tx(T('Love 21 Foundation', 'Love 21 基金會'))}</p><h1 className="mt-4 max-w-4xl font-display text-[clamp(3.25rem,9vw,7.75rem)] font-semibold leading-[0.88] tracking-tight text-white">{tx(T('Changing lives, one story at a time.', '一個故事，一次改變生活。'))}</h1><p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-xl">{tx(T('News, stories and progress from the Love 21 community.', 'Love 21 社群的新聞、故事與進展。'))}</p><div className="mt-10 flex gap-2" aria-label={tx(T('Hero slides', '主視覺圖片'))}>{HERO_SLIDES.map((slide, index) => <button key={slide.image} type="button" aria-label={`${index + 1}`} onClick={() => setHeroIndex(index)} className={cn('h-1 rounded-full transition-all', heroIndex === index ? 'w-10 bg-yellow' : 'w-5 bg-white/50')} />)}</div></div>
        </section>

        {featured && <section id="featured" className="bg-paper px-5 py-16 sm:px-10 sm:py-24 lg:px-16"><div className="mx-auto max-w-[1120px]"><p className="kicker text-navy/60">{tx(T('Featured story', '焦點故事'))}</p><article className="group mt-5 overflow-hidden rounded-md bg-navy"><div className="grid lg:grid-cols-[1.25fr,1fr]"><div className="relative min-h-[340px] overflow-hidden lg:min-h-[580px]"><img src={featured.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-navy/45 to-transparent" /></div><div className="flex flex-col justify-end px-7 py-10 sm:px-10 sm:py-14"><p className="text-sm font-semibold text-yellow">{locale === 'en' ? featured.category_en : featured.category_zh} <span className="ml-2 font-normal text-white/55">— {locale === 'en' ? featured.date_en : featured.date_zh}</span></p><h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-white sm:text-5xl">{locale === 'en' ? featured.headline_en : featured.headline_zh}</h2><p className="mt-5 leading-relaxed text-white/75">{locale === 'en' ? featured.summary_en : featured.summary_zh}</p><a href={featured.cta_href} className="mt-8 inline-flex w-fit items-center gap-3 border-b-2 border-yellow pb-2 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:text-yellow">{locale === 'en' ? featured.cta_label_en : featured.cta_label_zh} <span aria-hidden="true">→</span></a></div></div></article></div></section>}

        <section className="mx-auto max-w-[1120px] px-5 py-14 sm:px-10 sm:py-20 lg:px-16"><div className="grid grid-cols-3 gap-3 rounded-md bg-navy/5 p-6 text-center sm:gap-8 sm:p-10">{IMPACT_STATS.map((stat) => <AnimatedStat key={stat.value} {...stat} />)}</div></section>

        <section id="latest" className="relative bg-[#f8f7f3] px-5 py-16 sm:px-10 sm:py-24 lg:px-16"><div aria-hidden="true" className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'radial-gradient(#0c2340 1px, transparent 1px)', backgroundSize: '22px 22px' }} /><div className="relative mx-auto max-w-[1120px]"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="kicker text-navy/60">{tx(T('The latest', '最新消息'))}</p><h2 className="mt-2 font-display text-4xl font-semibold text-navy sm:text-5xl">{tx(T('Stories from our community', '社群故事'))}</h2></div><label className="relative block w-full sm:w-64"><span className="sr-only">{tx(T('Search news', '搜尋新聞'))}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tx(T('Search stories', '搜尋故事'))} className="min-h-11 w-full rounded-full border border-navy/15 bg-white px-5 text-sm text-navy placeholder:text-navy/40" /></label></div>
          <div className="no-scrollbar mt-7 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label={tx(T('News categories', '新聞分類'))}>{categories.map((category) => <button key={category} type="button" role="tab" aria-selected={tab === category} onClick={() => setTab(category)} className={cn('inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors', tab === category ? 'bg-navy text-white' : 'bg-white text-navy hover:bg-yellow/40')}><span aria-hidden="true">{CATEGORY_ICONS[category] ?? '○'}</span>{category === 'all' ? tx(T('All', '全部')) : category}</button>)}</div>
          {visible.length === 0 ? <p className="py-20 text-center text-navy/60">{tx(T('No stories match your search yet.', '暫時未有符合搜尋條件的故事。'))}</p> : <div className="mt-8 columns-1 gap-6 sm:columns-2 lg:columns-3">{visible.map((article, index) => <article key={article.id} onClick={() => markEducationRead(article.id)} onKeyDown={(e) => { if (e.key === 'Enter') markEducationRead(article.id) }} className="group mb-6 inline-block w-full break-inside-avoid overflow-hidden rounded-md bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"><div className={cn('overflow-hidden', index % 3 === 1 ? 'aspect-[4/5]' : index % 3 === 2 ? 'aspect-[5/4]' : 'aspect-[4/3]')}><img src={article.image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.08]" /></div><div className="p-6"><p className="text-xs font-bold uppercase tracking-[0.12em] text-navy/55">{locale === 'en' ? article.category_en : article.category_zh} <span className="font-normal">· {locale === 'en' ? article.date_en : article.date_zh}</span></p><h3 className="mt-3 text-xl font-bold leading-snug text-navy transition-colors group-hover:text-red">{locale === 'en' ? article.headline_en : article.headline_zh}</h3><p className="mt-3 leading-relaxed text-navy/75">{locale === 'en' ? article.summary_en : article.summary_zh}</p><a href={article.cta_href ?? '#'} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-navy">{article.cta_href ? (locale === 'en' ? article.cta_label_en ?? 'Read story' : article.cta_label_zh ?? '閱讀故事') : tx(T('Read story', '閱讀故事'))} <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span></a></div></article>)}</div>}</div></section>

        <section id="timeline" className="mx-auto max-w-[920px] px-5 py-16 sm:px-10 sm:py-24"><p className="kicker text-navy/60">{tx(T('This year', '今年'))}</p><h2 className="mt-2 font-display text-4xl font-semibold text-navy sm:text-5xl">{tx(T('A timeline of momentum', '持續前進的時間線'))}</h2><div className="mt-10 border-l-2 border-yellow pl-7 sm:ml-10 sm:pl-10">{[ARTICLES[0], ARTICLES[3], ARTICLES[2]].map((article) => <article key={article.id} className="relative pb-10 last:pb-0"><span className="absolute -left-[35px] top-1 h-4 w-4 rounded-full bg-navy sm:-left-[49px]" /><p className="text-sm font-bold text-red">{locale === 'en' ? article.date_en : article.date_zh}</p><h3 className="mt-1 text-xl font-bold text-navy">{locale === 'en' ? article.headline_en : article.headline_zh}</h3><p className="mt-2 max-w-xl text-navy/75">{locale === 'en' ? article.summary_en : article.summary_zh}</p></article>)}</div></section>

        <section id="gallery" className="bg-navy px-5 py-16 sm:px-10 sm:py-24 lg:px-16"><div className="mx-auto max-w-[1120px]"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="kicker text-yellow">{tx(T('In pictures', '照片故事'))}</p><h2 className="mt-2 font-display text-4xl font-semibold text-white sm:text-5xl">{tx(T('The moments that connect us', '連繫我們的美好時刻'))}</h2></div><p className="max-w-xs text-white/65">{tx(T('Tap a photo to view it in full.', '點選相片以全螢幕查看。'))}</p></div><div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">{GALLERY.map((photo, index) => <button key={photo.image} type="button" onClick={() => setLightboxIndex(index)} className={cn('group relative overflow-hidden rounded-md text-left', index === 0 || index === 5 ? 'row-span-2 aspect-[3/4]' : 'aspect-square')}><img src={photo.image} alt={photo.alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><span className="absolute inset-0 bg-navy/0 transition-colors group-hover:bg-navy/25" /><span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-navy opacity-0 transition-opacity group-hover:opacity-100">{tx(T('View', '查看'))}</span></button>)}</div></div></section>

        <section className="bg-yellow px-5 py-16 sm:px-10 sm:py-24 lg:px-16"><div className="mx-auto max-w-3xl text-center"><p className="text-5xl leading-none text-navy">“</p><blockquote className="mt-4 font-display text-3xl font-semibold leading-tight text-navy sm:text-5xl">{tx(QUOTES[quoteIndex].quote)}</blockquote><p className="mt-6 text-sm font-bold uppercase tracking-[0.13em] text-navy/65">{tx(QUOTES[quoteIndex].by)}</p><div className="mt-7 flex justify-center gap-2">{QUOTES.map((quote, index) => <button key={quote.by.en} type="button" onClick={() => setQuoteIndex(index)} aria-label={`${index + 1}`} className={cn('h-2 rounded-full transition-all', quoteIndex === index ? 'w-8 bg-navy' : 'w-2 bg-navy/35')} />)}</div></div></section>

        <BrandPatternBand variant="yellow" className="easy-hide" />
        <section id="newsletter" className="relative overflow-hidden bg-navy px-5 py-20 sm:px-10 sm:py-28 lg:px-16"><div aria-hidden="true" className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2200&q=85')" }} /><div aria-hidden="true" className="absolute inset-0 bg-navy/70" /><div className="relative mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-[1fr,0.8fr] lg:items-end"><div><p className="kicker text-yellow">{tx(T('Stay close', '保持聯繫'))}</p><h2 className="mt-3 font-display text-[clamp(3rem,6vw,5.5rem)] font-semibold leading-[0.92] text-white">{tx(T('Want to create more stories?', '想創造更多故事嗎？'))}</h2><p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">{tx(T('Receive Love 21 news in your inbox, or discover the many ways to be part of our community.', '在收件箱中接收 Love 21 最新消息，或探索加入我們社群的不同方式。'))}</p></div><div><form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-3 sm:flex-row"><label className="flex-1"><span className="sr-only">{tx(T('Email address', '電郵地址'))}</span><input type="email" required placeholder={tx(T('Email address', '電郵地址'))} className="min-h-12 w-full rounded-full border border-white/20 bg-white px-5 text-sm text-navy placeholder:text-navy/45" /></label><button type="submit" className="min-h-12 rounded-full bg-yellow px-7 text-sm font-bold text-navy">{tx(T('Subscribe', '訂閱'))}</button></form><div className="mt-7 flex flex-wrap gap-3"><a href="/volunteer" className="rounded-full border border-white/40 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-navy">{tx(T('Volunteer', '成為義工'))}</a><a href="/give" className="rounded-full border border-white/40 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-navy">{tx(T('Donate', '捐款'))}</a><a href="mailto:jeff@love21foundation.com" className="rounded-full border border-white/40 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-navy">{tx(T('Partner', '合作'))}</a></div></div></div></section>
      </main>
      {lightboxIndex !== null && <div role="dialog" aria-modal="true" aria-label={tx(T('Photo viewer', '相片檢視器'))} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-5" onClick={() => setLightboxIndex(null)}><button type="button" onClick={() => setLightboxIndex(null)} className="absolute right-5 top-5 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white">{tx(T('Close', '關閉'))} ×</button><button type="button" aria-label={tx(T('Previous photo', '上一張相片'))} onClick={(event) => { event.stopPropagation(); setLightboxIndex((lightboxIndex + GALLERY.length - 1) % GALLERY.length) }} className="absolute left-4 text-4xl text-white sm:left-8">‹</button><img src={GALLERY[lightboxIndex].image} alt={GALLERY[lightboxIndex].alt} className="max-h-[85vh] max-w-[82vw] rounded-sm object-contain" onClick={(event) => event.stopPropagation()} /><button type="button" aria-label={tx(T('Next photo', '下一張相片'))} onClick={(event) => { event.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % GALLERY.length) }} className="absolute right-4 text-4xl text-white sm:right-8">›</button></div>}
      <SiteFooter />
    </div>
  )
}

export default NewsPage
