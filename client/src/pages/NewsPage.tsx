import React, { useMemo, useState } from 'react'
import { SkipLink } from '@/components/skip-link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useSite } from '@/components/site-provider'
import { BrandPatternBand, LovePatternBg } from '@/components/brand-pattern'
import { cn } from '@/lib/utils'

type Article = {
  id: string
  category: string
  headline_en: string
  summary_en: string
  headline_zh: string
  summary_zh: string
}

const ARTICLES: Article[] = [
  {
    id: 'banquet',
    category: 'Events',
    headline_en: 'Celebrating Potential at the Beyond Limits Banquet',
    summary_en:
      'Join us for an unforgettable evening dedicated to celebrating our neurodiverse community. All proceeds directly support our sports, nutrition, and counseling programs for local families.',
    headline_zh: '在「Beyond Limits」慈善晚宴上慶祝潛能',
    summary_zh:
      '加入我們的慈善晚宴，一同慶祝神經多樣性社群，所有收入將直接支持我們的運動、營養與輔導計劃。',
  },
  {
    id: 'nutrition',
    category: 'Program Highlight',
    headline_en: 'Nurturing Wellness Through One-on-One Nutrition',
    summary_en:
      "Discover how Love 21’s tailored nutrition consultations are helping members build healthy habits and improve physical well-being alongside regular sports training.",
    headline_zh: '透過一對一營養諮詢培養健康',
    summary_zh:
      '了解 Love 21 的個人化營養諮詢如何幫助學員建立健康習慣，配合運動訓練提升身體健康。',
  },
  {
    id: 'vocational',
    category: 'Community Impact',
    headline_en: 'Expanding Pathways: Vocational Training at Love 21',
    summary_en:
      'Learn more about our employment support initiative designed to equip neurodiverse young adults with practical workplace skills and confidence.',
    headline_zh: '擴展道路：Love 21 的職業培訓',
    summary_zh:
      '了解我們的就業支援計劃，如何為神經多樣性青年提供實用職場技能與信心。',
  },
]

export function NewsPage() {
  const { t, locale } = useSite()
  const [tab, setTab] = useState<string>('all')

  const categories = useMemo(() => {
    const set = new Set<string>(ARTICLES.map((a) => a.category))
    return ['all', ...Array.from(set)]
  }, [])

  const visible = ARTICLES.filter((a) => tab === 'all' || a.category === tab)

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <LovePatternBg variant="red">
          <div className="mx-auto max-w-[1120px] px-4 py-14 sm:px-8 sm:py-20">
            <p className="kicker text-yellow">{locale === 'en' ? 'News' : '新聞'}</p>
            <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.75rem)] font-semibold text-white">
              {locale === 'en' ? 'News & Updates' : '新聞與更新'}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              {locale === 'en'
                ? 'Latest updates from Love 21 Foundation.'
                : 'Love 21 最新消息與項目更新。'}
            </p>
          </div>
        </LovePatternBg>

        <BrandPatternBand variant="yellow" className="easy-hide" />

        <div className="sticky top-14 z-20 border-y border-navy/10 bg-white/95 backdrop-blur sm:top-[72px]">
          <div className="no-scrollbar mx-auto flex max-w-[1120px] gap-2 overflow-x-auto px-4 py-3 sm:px-8" role="tablist" aria-label="News categories">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={tab === c}
                onClick={() => setTab(c)}
                className={cn(
                  'min-h-11 shrink-0 rounded-full px-6 text-sm font-semibold',
                  tab === c ? 'bg-navy text-white' : 'bg-white text-navy',
                )}
              >
                {c === 'all' ? (locale === 'en' ? 'All' : '全部') : c}
              </button>
            ))}
          </div>
        </div>

        <section className="mx-auto max-w-[1120px] px-4 py-10 sm:px-8 sm:py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((a) => (
              <article key={a.id} className="rounded-md border border-black/5 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-navy/70">{a.category}</div>
                <h2 className="mt-2 text-lg font-bold text-navy">{locale === 'en' ? a.headline_en : a.headline_zh}</h2>
                <p className="mt-2 text-navy/85">{locale === 'en' ? a.summary_en : a.summary_zh}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

export default NewsPage
