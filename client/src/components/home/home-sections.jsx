import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { List, Medal, Ship, Trophy, UtensilsCrossed, X } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { cn } from '@/lib/utils'
import {
  ANNUAL_REPORT,
  BOARD,
  HOME_SECTION_NAV,
  MEMBER_ACHIEVEMENTS,
  PARTNER_QUOTE_EXTRA,
  PROGRAMME_CARDS,
  STORY_MILESTONES,
  pickLocale,
} from '@/lib/home-content'

const MILESTONE_ICONS = {
  medal: Medal,
  utensils: UtensilsCrossed,
  trophy: Trophy,
  ship: Ship,
}

export function HomeSectionNav() {
  const { locale, t } = useSite()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState(HOME_SECTION_NAV[0].id)

  // Show the control once you've scrolled into page content
  useEffect(() => {
    const onScroll = () => {
      const impact = document.getElementById('impact')
      const threshold = impact ? impact.offsetTop - 80 : 420
      setVisible(window.scrollY >= threshold)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // Scroll-spy: last nav section whose top has crossed the focus line.
  // IntersectionObserver is flaky here — it only reports *changed* entries, so
  // mid sections (esp. Stories) get skipped when scrolling Impact → Programmes.
  useEffect(() => {
    let frame = 0

    const updateActive = () => {
      const marker = window.innerHeight * 0.28
      let current = HOME_SECTION_NAV[0].id

      for (const item of HOME_SECTION_NAV) {
        const el = document.getElementById(item.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= marker) current = item.id
      }

      setActive((prev) => (prev === current ? prev : current))
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(updateActive)
    }

    updateActive()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // Escape closes
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const activeItem = HOME_SECTION_NAV.find((item) => item.id === active) || HOME_SECTION_NAV[0]
  const activeIndex = HOME_SECTION_NAV.findIndex((item) => item.id === active)

  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActive(id)
    // Keep open on desktop so you can keep navigating; close on small screens
    if (window.matchMedia('(max-width: 1023px)').matches) setOpen(false)
  }

  const contentsLabel =
    locale === 'en' ? 'Contents' : locale === 'zh-Hans' ? '目录' : '目錄'
  const closeLabel = locale === 'en' ? 'Close' : locale === 'zh-Hans' ? '关闭' : '關閉'
  const openLabel =
    locale === 'en' ? 'Open page contents' : locale === 'zh-Hans' ? '打开页面目录' : '開啟頁面目錄'

  return (
    <>
      {/* Scrim — mobile / tablet when open */}
      <button
        type="button"
        aria-label={closeLabel}
        tabIndex={open ? 0 : -1}
        className={cn(
          'fixed inset-0 z-[55] bg-navy/40 transition-opacity lg:hidden',
          open && visible ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setOpen(false)}
      />

      {/* Collapsed tab */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls="home-section-sidebar"
        aria-label={openLabel}
        onClick={() => setOpen(true)}
        className={cn(
          'fixed top-1/2 left-0 z-[56] flex -translate-y-1/2 items-center gap-2 rounded-r-md bg-navy py-3 pr-3 pl-2.5 text-white shadow-lg transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow',
          visible && !open
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none -translate-x-full opacity-0',
        )}
      >
        <List className="size-4 shrink-0 text-yellow" aria-hidden />
        <span className="flex flex-col items-start leading-none">
          <span className="font-display text-sm font-semibold tabular-nums text-yellow">
            {String(activeIndex + 1).padStart(2, '0')}
          </span>
          <span className="mt-0.5 max-w-[4.5rem] truncate text-[10px] font-bold tracking-wide uppercase">
            {pickLocale(activeItem, locale)}
          </span>
        </span>
      </button>

      {/* Sidebar panel */}
      <aside
        id="home-section-sidebar"
        aria-label={t.homeSections.navLabel}
        aria-hidden={!open}
        className={cn(
          'fixed top-0 left-0 z-[57] flex h-dvh w-[min(18.5rem,88vw)] flex-col bg-navy text-white shadow-2xl transition-transform duration-300 ease-out',
          open && visible ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="kicker text-yellow">{contentsLabel}</p>
            <p className="mt-1 text-sm text-white/55">
              {locale === 'en'
                ? 'Scroll or jump'
                : locale === 'zh-Hans'
                  ? '滚动或跳转'
                  : '滾動或跳轉'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={closeLabel}
            className="inline-flex size-10 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ol className="flex flex-col gap-0.5">
            {HOME_SECTION_NAV.map((item, index) => {
              const isActive = active === item.id
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={(event) => {
                      event.preventDefault()
                      goTo(item.id)
                    }}
                    className={cn(
                      'group flex items-center gap-3 rounded-md px-3 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow',
                      isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <span
                      className={cn(
                        'w-7 shrink-0 font-display text-base font-semibold tabular-nums',
                        isActive ? 'text-yellow' : 'text-white/35 group-hover:text-white/55',
                      )}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={cn('text-[15px]', isActive ? 'font-bold' : 'font-semibold')}>
                      {pickLocale(item, locale)}
                    </span>
                    {isActive && (
                      <span className="ml-auto size-1.5 rounded-full bg-yellow" aria-hidden />
                    )}
                  </a>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-yellow transition-[width] duration-300 ease-out"
              style={{
                width: `${((activeIndex + 1) / HOME_SECTION_NAV.length) * 100}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-white/45">
            {activeIndex + 1} / {HOME_SECTION_NAV.length}
          </p>
        </div>
      </aside>
    </>
  )
}

export function AnnualReportBar() {
  const { locale } = useSite()
  const [latest, ...prior] = ANNUAL_REPORT.downloads
  return (
    <div className="mx-auto flex max-w-[1120px] items-center justify-center px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex w-full flex-col items-center gap-5 rounded-md border border-navy/10 bg-white px-6 py-8 text-center sm:px-10">
        <div className="max-w-2xl">
          <h3 className="font-display text-xl font-semibold text-navy sm:text-2xl">
            {pickLocale(ANNUAL_REPORT.title, locale)}
          </h3>
          <div className="mt-2 space-y-3 text-navy/75">
            {ANNUAL_REPORT.body.map((paragraph, index) => (
              <p key={index}>{pickLocale(paragraph, locale)}</p>
            ))}
          </div>
        </div>
        <a
          href={latest.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          {pickLocale(ANNUAL_REPORT.primaryCta, locale)} →
        </a>
        {prior.length > 0 && (
          <p className="text-sm text-navy/55">
            <span>{pickLocale(ANNUAL_REPORT.priorLabel, locale)}:&nbsp;</span>
            {prior.map((report, index) => (
              <span key={report.year}>
                {index > 0 && <span aria-hidden="true"> · </span>}
                <a
                  href={report.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-navy/70 underline-offset-2 transition-colors hover:text-navy hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  {report.year}
                </a>
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  )
}

export function CommunityMilestones() {
  const { locale } = useSite()
  const [active, setActive] = useState(0)
  const current = MEMBER_ACHIEVEMENTS[active]
  const CurrentIcon = MILESTONE_ICONS[current.icon] || Medal

  return (
    <section className="overflow-hidden bg-navy px-5 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-[1120px]">
        <p className="kicker text-yellow">
          {locale === 'en' ? 'Community achievements' : locale === 'zh-Hans' ? '社群成就' : '社群成就'}
        </p>
        <h2 className="mt-3 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold text-white">
          {locale === 'en'
            ? 'Milestones our members are proud of.'
            : locale === 'zh-Hans'
              ? '会员引以为傲的里程碑。'
              : '會員引以為傲的里程碑。'}
        </h2>

        <div className="relative mt-8 min-h-[280px] overflow-hidden rounded-xl border border-white/15 sm:min-h-[340px]">
          <img
            src={current.image}
            alt={pickLocale(current.title, locale)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/50 to-navy/15" />
          <div className="relative flex min-h-[280px] flex-col justify-end p-6 sm:min-h-[340px] sm:p-10">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-yellow text-navy">
              <CurrentIcon className="size-6" aria-hidden />
            </span>
            <h3 className="mt-4 max-w-2xl font-display text-2xl font-semibold text-white sm:text-3xl">
              {pickLocale(current.title, locale)}
            </h3>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/85">
              {pickLocale(current.body, locale)}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <span className="rounded-full bg-yellow px-4 py-2 text-sm font-bold text-navy">
                {pickLocale(current.stat, locale)}
              </span>
              <a
                href={current.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold tracking-wide text-white/85 uppercase hover:text-yellow"
              >
                {locale === 'en' ? 'View story' : locale === 'zh-Hans' ? '查看故事' : '查看故事'} →
              </a>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MEMBER_ACHIEVEMENTS.map((item, index) => {
            const Icon = MILESTONE_ICONS[item.icon] || Medal
            return (
              <button
                key={item.title.en}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  'rounded-lg border-2 p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow',
                  index === active
                    ? 'border-yellow bg-white/10'
                    : 'border-white/15 bg-white/5 hover:bg-white/10',
                )}
              >
                <Icon
                  className={cn('size-5 shrink-0', index === active ? 'text-yellow' : 'text-white/70')}
                  aria-hidden="true"
                />
                <p
                  className={cn(
                    'mt-2 text-sm font-bold',
                    index === active ? 'text-yellow' : 'text-white',
                  )}
                >
                  {pickLocale(item.title, locale)}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function PartnerCsrBand() {
  const { locale } = useSite()
  return (
    <section className="bg-paper px-5 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-[1120px] gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-navy/10 bg-white p-7 sm:p-9">
          <p className="kicker text-navy/60">
            {locale === 'en' ? 'What our partners say' : locale === 'zh-Hans' ? '合作伙伴分享' : '合作夥伴分享'}
          </p>
          {PARTNER_QUOTE_EXTRA.map((item) => (
            <figure key={item.by} className="mt-6 first:mt-5">
              <blockquote className="text-base leading-relaxed text-navy/85 italic">
                “{pickLocale(item.quote, locale)}”
              </blockquote>
              <figcaption className="mt-3 text-sm font-bold text-navy/60">{item.by}</figcaption>
            </figure>
          ))}
        </div>
        <div className="rounded-md bg-yellow p-7 sm:p-9">
          <p className="kicker text-navy/60">
            {locale === 'en' ? 'Corporate Social Responsibility' : locale === 'zh-Hans' ? '企业社会责任' : '企業社會責任'}
          </p>
          <h2 className="mt-4 font-display text-2xl font-semibold text-navy sm:text-3xl">
            {locale === 'en' ? 'Interested in a CSR Day?' : locale === 'zh-Hans' ? '有兴趣举办 CSR 日吗？' : '有興趣舉辦 CSR 日嗎？'}
          </h2>
          <p className="mt-4 leading-relaxed text-navy/80">
            {locale === 'en'
              ? 'Bring your team into our community for a meaningful, hands-on experience. Contact our Founder/CEO to learn more.'
              : locale === 'zh-Hans'
                ? '让你的团队走进我们的社群，参与有意义的亲身体验。欢迎联络我们的创办人／行政总裁了解更多。'
                : '讓你的團隊走進我們的社群，參與有意義的親身體驗。歡迎聯絡我們的創辦人／行政總裁了解更多。'}
          </p>
          <a
            href="mailto:jeff@love21foundation.com"
            className="mt-7 inline-flex rounded-full bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-navy/90"
          >
            jeff@love21foundation.com
          </a>
        </div>
      </div>
    </section>
  )
}

export function StoryTimeline() {
  const { locale } = useSite()
  return (
    <section className="bg-[#f8f7f3] px-5 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-[1120px]">
        <p className="kicker text-navy/60">
          {locale === 'en' ? 'Our story' : locale === 'zh-Hans' ? '我们的故事' : '我們的故事'}
        </p>
        <h2 className="mt-3 max-w-3xl font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold text-navy">
          {locale === 'en' ? 'A story written together.' : locale === 'zh-Hans' ? '一个共同书写的故事。' : '一個共同書寫的故事。'}
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-navy/80 sm:text-lg">
          {locale === 'en'
            ? 'Love 21 empowers Hong Kong’s Down syndrome and autistic community through sport, nutrition and holistic support. It began with a personal question about life expectancy — and almost no answers. We exist to change that, one family at a time.'
            : locale === 'zh-Hans'
              ? 'Love 21 透过运动、营养和全面支援，为香港唐氏综合症及自闭症社群赋能。它始于一个关于预期寿命的个人问题——几乎找不到答案。我们的存在，是为了逐一家庭带来改变。'
              : 'Love 21 透過運動、營養和全面支援，為香港唐氏綜合症及自閉症社群賦能。它始於一個關於預期壽命的個人問題——幾乎找不到答案。我們的存在，是為了逐一家庭帶來改變。'}
        </p>

        <div className="relative mt-12 border-l-2 border-yellow pl-6 sm:ml-4 sm:pl-10">
          {STORY_MILESTONES.map((item, index) => (
            <article
              key={item.year}
              className="relative grid items-center gap-5 pb-12 last:pb-0 lg:grid-cols-2 lg:gap-10"
            >
              <span className="absolute top-1 -left-[31px] h-3.5 w-3.5 rounded-full bg-navy sm:-left-[47px]" />
              <div className={cn('overflow-hidden rounded-md', index % 2 === 1 && 'lg:order-2')}>
                <img
                  src={item.image}
                  alt={pickLocale(item.title, locale)}
                  className="aspect-[16/10] w-full object-cover transition-transform duration-500 hover:scale-[1.03] motion-reduce:transition-none"
                />
              </div>
              <div className={index % 2 === 1 ? 'lg:order-1' : undefined}>
                <p className="font-display text-3xl font-semibold text-red">{item.year}</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-navy sm:text-2xl">
                  {pickLocale(item.title, locale)}
                </h3>
                <p className="mt-3 max-w-lg leading-relaxed text-navy/75">
                  {pickLocale(item.body, locale)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProgrammesBand() {
  const { locale } = useSite()
  return (
    <section id="programmes" className="scroll-mt-28 bg-white px-5 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-[1120px]">
        <p className="kicker text-navy/60">
          {locale === 'en' ? 'At the heart of Love 21' : locale === 'zh-Hans' ? 'Love 21 的核心' : 'Love 21 的核心'}
        </p>
        <h2 className="mt-3 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold text-navy">
          {locale === 'en' ? 'Our programmes' : locale === 'zh-Hans' ? '我们的活动' : '我們的活動'}
        </h2>

        <div className="mt-10 divide-y divide-navy/10 border-y border-navy/10">
          {PROGRAMME_CARDS.map((card) => {
            const external = card.href.startsWith('mailto:')
            const ctaClass =
              'mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-teal underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy'
            return (
              <article key={card.id} className="grid gap-6 py-10 lg:grid-cols-[minmax(0,0.35fr)_minmax(0,1fr)] lg:gap-12">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
                    {pickLocale(card.title, locale)}
                  </h3>
                  {external ? (
                    <a href={card.href} className={ctaClass}>
                      {pickLocale(card.cta, locale)} →
                    </a>
                  ) : (
                    <Link to={card.href} className={ctaClass}>
                      {pickLocale(card.cta, locale)} →
                    </Link>
                  )}
                </div>
                <div>
                  <div className="space-y-4 text-base leading-relaxed text-navy/80">
                    {card.paragraphs.map((paragraph, index) => (
                      <p key={index}>{pickLocale(paragraph, locale)}</p>
                    ))}
                  </div>
                  {card.quotes?.length > 0 && (
                    <div className="mt-6 space-y-5 border-l-2 border-yellow pl-5">
                      {card.quotes.map((item) => (
                        <figure key={item.by}>
                          <blockquote className="text-[15px] leading-relaxed text-navy/75 italic">
                            “{pickLocale(item.quote, locale)}”
                          </blockquote>
                          <figcaption className="mt-2 text-sm font-bold text-navy/55">
                            {item.by}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function LeadershipBand() {
  const { locale } = useSite()
  return (
    <section id="leadership" className="scroll-mt-28 px-5 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-[1120px]">
        <p className="kicker text-navy/60">
          {locale === 'en'
            ? 'The people behind the purpose'
            : locale === 'zh-Hans'
              ? '使命背后的团队'
              : '使命背後的團隊'}
        </p>
        <h2 className="mt-3 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold text-navy">
          {locale === 'en' ? 'Leadership' : locale === 'zh-Hans' ? '领导团队' : '領導團隊'}
        </h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-navy/75">
          {locale === 'en'
            ? 'Our Board of Directors brings diverse professional backgrounds and care to strengthen Love 21.'
            : locale === 'zh-Hans'
              ? '我们的董事会由不同专业背景的关怀人士组成，以才能和热诚支持 Love 21。'
              : '我們的董事會由不同專業背景的關懷人士組成，以才能和熱誠支持 Love 21。'}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {BOARD.map((member) => (
            <div
              key={member.name}
              className="overflow-hidden rounded-md border border-navy/10 bg-white"
            >
              <div className="aspect-[4/3] overflow-hidden bg-navy/10">
                <img
                  src={member.image}
                  alt={member.name}
                  className={cn(
                    'h-full w-full object-cover',
                    member.position || 'object-center',
                  )}
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold text-navy">{member.name}</h3>
                <p className="mt-0.5 text-xs text-navy/60">
                  {locale === 'en' ? 'Board of Directors' : locale === 'zh-Hans' ? '董事会' : '董事會'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
