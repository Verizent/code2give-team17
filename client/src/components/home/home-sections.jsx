import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '@/components/site-provider'
import { cn } from '@/lib/utils'
import { getArticles, getReportArticle } from '@/features/content/api'
import {
  ANNUAL_REPORT,
  BOARD,
  HOME_GALLERY,
  HOME_SECTION_NAV,
  MEMBER_ACHIEVEMENTS,
  PARTNER_QUOTE_EXTRA,
  PROGRAMME_CARDS,
  STORY_MILESTONES,
  pickLocale,
} from '@/lib/home-content'

export function HomeSectionNav() {
  const { locale, t } = useSite()
  const [active, setActive] = useState(HOME_SECTION_NAV[0].id)

  useEffect(() => {
    const els = HOME_SECTION_NAV.map((item) => document.getElementById(item.id)).filter(Boolean)
    if (!els.length) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (hit?.target?.id) setActive(hit.target.id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.1, 0.4] },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <nav
      aria-label={t.homeSections.navLabel}
      className="sticky top-14 z-30 border-b border-navy/10 bg-white/95 backdrop-blur sm:top-16"
    >
      <div className="mx-auto flex w-full max-w-[1120px] gap-1.5 px-4 py-3 sm:gap-2 sm:px-8">
        {HOME_SECTION_NAV.map((item, index) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(event) => {
              event.preventDefault()
              document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              setActive(item.id)
            }}
            className={cn(
              'flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-full px-1.5 py-2 text-center text-[11px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:px-3 sm:text-sm',
              active === item.id
                ? 'bg-navy text-white'
                : 'bg-white text-navy shadow-sm hover:bg-yellow/30',
            )}
          >
            0{index + 1} {pickLocale(item, locale)}
          </a>
        ))}
      </div>
    </nav>
  )
}

export function AnnualReportBar() {
  const { locale } = useSite()
  const [report, setReport] = useState(null)

  useEffect(() => {
    let cancelled = false
    getReportArticle(locale).then((data) => {
      if (!cancelled) setReport(data)
    })
    return () => {
      cancelled = true
    }
  }, [locale])

  // The published report article supplies the headline and standfirst when it exists;
  // the link stays the hardcoded PDF either way, because there is no in-site article
  // route to send people to (App.jsx redirects /news straight back to /#stories).
  const title = report?.title ?? pickLocale(ANNUAL_REPORT.title, locale)
  const body = report?.excerpt ?? pickLocale(ANNUAL_REPORT.body, locale)

  return (
    <div className="mx-auto flex max-w-[1120px] items-center justify-center px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex w-full flex-col items-center gap-5 rounded-md border border-navy/10 bg-white px-6 py-8 text-center sm:px-10">
        <div className="max-w-xl">
          <h3 className="text-lg font-bold text-navy">{title}</h3>
          <p className="mt-1 text-navy/75">{body}</p>
        </div>
        <a
          href={ANNUAL_REPORT.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          {pickLocale(ANNUAL_REPORT.cta, locale)} →
        </a>
      </div>
    </div>
  )
}

export function CommunityMilestones() {
  const { locale } = useSite()
  const [active, setActive] = useState(0)
  const current = MEMBER_ACHIEVEMENTS[active]

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
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-yellow/90 text-2xl">
              {current.icon}
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
          {MEMBER_ACHIEVEMENTS.map((item, index) => (
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
              <span className="text-xl">{item.icon}</span>
              <p
                className={cn(
                  'mt-2 text-sm font-bold',
                  index === active ? 'text-yellow' : 'text-white',
                )}
              >
                {pickLocale(item.title, locale)}
              </p>
            </button>
          ))}
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
    <section id="stories" className="scroll-mt-28 bg-[#f8f7f3] px-5 py-14 sm:px-8 sm:py-20">
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

/** Bundled stand-in for article covers that fail to load (see the onError below). */
const STORY_COVER_FALLBACK = '/brand/gallery.jpeg'

/**
 * The only Home surface fed by editorial content staff actually publish:
 * an article created in /admin/articles shows up here on the next load.
 * Cards deliberately do not link anywhere — there is no article detail route
 * yet, and a card that bounces you back to Home reads as a broken page.
 */
export function LatestStories() {
  const { locale } = useSite()
  const [articles, setArticles] = useState([])

  useEffect(() => {
    let cancelled = false
    getArticles({ locale, limit: 3 }).then((data) => {
      if (!cancelled) setArticles(data)
    })
    return () => {
      cancelled = true
    }
  }, [locale])

  if (!articles.length) return null

  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <section aria-labelledby="latest-stories-heading" className="bg-paper px-5 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-[1120px]">
        <p className="kicker text-navy/60">
          {locale === 'en' ? 'From the newsroom' : locale === 'zh-Hans' ? '最新消息' : '最新消息'}
        </p>
        <h2
          id="latest-stories-heading"
          className="mt-3 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold text-navy"
        >
          {locale === 'en'
            ? 'Latest stories'
            : locale === 'zh-Hans'
              ? '最新故事'
              : '最新故事'}
        </h2>

        <ul className="mt-8 grid gap-5 sm:grid-cols-3">
          {articles.map((article) => (
            <li
              key={article.id}
              className="flex flex-col overflow-hidden rounded-md border border-navy/10 bg-white"
            >
              <div className="aspect-[16/10] overflow-hidden bg-navy/10">
                <img
                  src={article.cover_image_url || STORY_COVER_FALLBACK}
                  alt={article.cover_alt || ''}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    // Seeded rows carry placehold.co cover URLs, so every card breaks
                    // the moment the demo machine is offline. Swap to a bundled asset
                    // once, and let the second failure alone so we cannot loop.
                    const img = event.currentTarget
                    if (img.dataset.fallbackApplied) return
                    img.dataset.fallbackApplied = 'true'
                    img.src = STORY_COVER_FALLBACK
                  }}
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="kicker text-navy/50">{article.category}</p>
                <h3 className="mt-2 font-display text-lg font-bold text-navy">{article.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-navy/75">
                  {article.excerpt}
                </p>
                {article.published_at && (
                  <p className="mt-4 text-xs font-bold text-navy/50">
                    <time dateTime={article.published_at}>
                      {dateFormatter.format(new Date(article.published_at))}
                    </time>
                    {article.reading_time_minutes
                      ? ` · ${article.reading_time_minutes} ${
                          locale === 'en' ? 'min read' : locale === 'zh-Hans' ? '分钟' : '分鐘'
                        }`
                      : ''}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {PROGRAMME_CARDS.map((card) => {
            const external = card.href.startsWith('mailto:')
            const className =
              'rounded-md border border-navy/10 bg-paper p-6 transition-colors hover:border-navy/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy'
            const inner = (
              <>
                <h3 className="font-display text-xl font-bold text-navy">
                  {pickLocale(card.title, locale)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-navy/75">
                  {pickLocale(card.body, locale)}
                </p>
              </>
            )
            return external ? (
              <a key={card.id} href={card.href} className={className}>
                {inner}
              </a>
            ) : (
              <Link key={card.id} to={card.href} className={className}>
                {inner}
              </Link>
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

export function CommunityGallery() {
  const { locale } = useSite()
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    if (lightbox === null) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightbox])

  return (
    <>
      <section id="gallery" className="scroll-mt-28 bg-[#f8f7f3] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1120px]">
          <p className="kicker text-navy/60">
            {locale === 'en' ? 'In pictures' : locale === 'zh-Hans' ? '照片故事' : '照片故事'}
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold text-navy">
            {locale === 'en'
              ? 'Our community in motion'
              : locale === 'zh-Hans'
                ? '我们的活力社群'
                : '我們的活力社群'}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {HOME_GALLERY.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setLightbox(index)}
                className={cn(
                  'group relative overflow-hidden rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy',
                  index === 0 ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-square',
                )}
              >
                <img
                  src={image}
                  alt={
                    locale === 'en'
                      ? `Community photo ${index + 1}`
                      : locale === 'zh-Hans'
                        ? `社群照片 ${index + 1}`
                        : `社群照片 ${index + 1}`
                  }
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-5"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 text-sm font-bold text-white"
          >
            × {locale === 'en' ? 'Close' : locale === 'zh-Hans' ? '关闭' : '關閉'}
          </button>
          <img
            src={HOME_GALLERY[lightbox]}
            alt={
              locale === 'en'
                ? `Community photo ${lightbox + 1}`
                : locale === 'zh-Hans'
                  ? `社群照片 ${lightbox + 1}`
                  : `社群照片 ${lightbox + 1}`
            }
            className="max-h-[85vh] max-w-[85vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
