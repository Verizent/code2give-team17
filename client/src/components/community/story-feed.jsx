import { useEffect, useRef, useState } from 'react'
import { useSite } from '@/components/site-provider'
import { ACTIVITY_TYPES, knowledgeStats, stories } from '@/lib/mock'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { FadeRise } from '@/components/community/fade-rise'
import { StoryCard } from '@/components/community/story-card'
import { KnowledgeCard } from '@/components/community/knowledge-card'
import { InstagramCard } from '@/components/community/instagram-card'
import { listVoices, listInstagram } from '@/features/content/api'
import { mapVoice } from '@/features/content/map-voice'

/** Stories per page of the wall. */
const PAGE_SIZE = 10
/**
 * An embed with display_order N lands after story N × this. Spreading them out beats
 * placing them at story N, which would bunch all three at the top — but the product
 * must divide into PAGE_SIZE, or an embed lands past the fold and is invisible until
 * the visitor expands. At 3, orders 1–3 sit after stories 3, 6 and 9.
 */
const EMBED_SPACING = 3

/** Count-up header for the Ability Wall. Plays once, on first scroll into view. */
function MomentsCounter({ count }) {
  const { t } = useSite()
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const [display, setDisplay] = useState(reduced ? count : 0)

  useEffect(() => {
    const node = ref.current
    if (!node || reduced) {
      setDisplay(count)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const duration = 1200
        const start = performance.now()
        const step = (now) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setDisplay(Math.round(eased * count))
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      },
      { threshold: 0.3 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [reduced, count])

  return (
    <p
      ref={ref}
      className="font-display text-[clamp(1.5rem,4vw,2.25rem)] font-bold text-navy"
    >
      <span aria-hidden="true">{display.toLocaleString()}</span>
      <span className="sr-only">{count.toLocaleString()}</span>{' '}
      {t.community.momentsLabel}
    </p>
  )
}

function buildFeed(filter, voices, embeds, page) {
  // A submission now carries its own activity type, so it filters exactly like a
  // curated story. One submitted before the field existed has `type: null` and stays
  // in "All" — filing it under a programme would assert one nobody recorded.
  const all = [...voices, ...stories]
  const ordered = (filter === 'all' ? all : all.filter((s) => s.type === filter)).sort(
    (a, b) => new Date(b.postedAt) - new Date(a.postedAt),
  )

  // A page counts stories, not cards: knowledge and Instagram cards are furniture
  // between them, so counting those would make later pages hold fewer actual stories.
  const start = page * PAGE_SIZE
  const visible = ordered.slice(start, start + PAGE_SIZE)

  const entries = []

  visible.forEach((story, index) => {
    entries.push({ key: `story-${story.id}`, kind: 'story', story })

    // Position is measured against the story's place in the whole wall, not its place
    // on this page. Counting per page would repeat the same three embeds on every
    // page; counted absolutely, each one appears once, on the page it falls in.
    const position = start + index + 1

    // Knowledge cards only in the full feed — they educate the whole community
    if (filter === 'all') {
      for (const k of knowledgeStats) {
        if (k.afterStoryCount === position) {
          entries.push({ key: `know-${k.id}`, kind: 'knowledge', knowledge: k })
        }
      }
      // display_order is the admin's intent for placement, so it drives position here
      // rather than being sorted by date like a story — an embed has no post date.
      for (const embed of embeds) {
        if (embed.display_order * EMBED_SPACING === position) {
          entries.push({ key: `ig-${embed.id}`, kind: 'instagram', embed })
        }
      }
    }
  })

  return {
    entries,
    total: ordered.length,
    from: visible.length === 0 ? 0 : start + 1,
    to: start + visible.length,
    pageCount: Math.max(1, Math.ceil(ordered.length / PAGE_SIZE)),
  }
}

/**
 * Flex-column masonry — NOT CSS `columns`.
 *
 * CSS multi-column layout under-counts height when children use transforms,
 * percentage widths, or replaced content with intrinsic portrait sizes. That
 * packs a short column box while the huddle carousel still paints at full
 * 768×1024 — floating over ArticlesCta / Stay close. Flex columns use normal
 * block flow, so card height always reserves space for following sections.
 */
function useMasonryColumnCount() {
  const [count, setCount] = useState(1)

  useEffect(() => {
    const sm = window.matchMedia('(min-width: 640px)')
    const lg = window.matchMedia('(min-width: 1024px)')
    const sync = () => setCount(lg.matches ? 3 : sm.matches ? 2 : 1)
    sync()
    sm.addEventListener('change', sync)
    lg.addEventListener('change', sync)
    return () => {
      sm.removeEventListener('change', sync)
      lg.removeEventListener('change', sync)
    }
  }, [])

  return count
}

function splitIntoColumns(items, columnCount) {
  const columns = Array.from({ length: columnCount }, () => [])
  items.forEach((item, index) => {
    columns[index % columnCount].push({ item, index })
  })
  return columns
}

export function StoryFeed() {
  const { locale, t } = useSite()
  const [filter, setFilter] = useState('all')
  const [voices, setVoices] = useState([])
  const [embeds, setEmbeds] = useState([])
  const [page, setPage] = useState(0)
  const feedTopRef = useRef(null)

  // Curated stories render immediately; approved submissions fold in when they land,
  // so a slow API delays nothing the visitor is already looking at.
  useEffect(() => {
    let cancelled = false
    listVoices().then((rows) => {
      if (!cancelled) setVoices(rows.map(mapVoice))
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    listInstagram(locale).then((rows) => {
      if (!cancelled) setEmbeds(rows)
    })
    return () => {
      cancelled = true
    }
  }, [locale])

  const { entries: feed, total, from, to, pageCount } = buildFeed(filter, voices, embeds, page)

  // The headline counts every moment on the wall, not the current tab or page — it is
  // a claim about the community, so it must not shrink when someone picks a filter.
  // Instagram embeds are excluded: they are the foundation's own posts, not a member
  // moment, and counting them would inflate the number.
  const momentsTotal = stories.length + voices.length

  function changeFilter(id) {
    setFilter(id)
    // Without this, switching to a tab with three stories while on page 3 shows an
    // empty wall and no obvious way back.
    setPage(0)
  }

  function goToPage(next) {
    setPage(next)
    // Paging without this leaves the visitor at the bottom of the previous page,
    // looking at the controls rather than at the new cards.
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Flex-column masonry rather than CSS `columns` — see useMasonryColumnCount for why.
  // It takes the already-paginated entries, so paging and the layout fix compose
  // instead of competing.
  const columnCount = useMasonryColumnCount()
  const columns = splitIntoColumns(feed, columnCount)

  const tabs = [
    { id: 'all', label: t.community.filterAll },
    ...ACTIVITY_TYPES.map((id) => ({ id, label: t.community.filters[id] })),
  ]

  return (
    <section ref={feedTopRef} aria-labelledby="feed-title" className="scroll-mt-28 mt-14">
      <h2 id="feed-title" className="sr-only">
        Story feed
      </h2>

      <MomentsCounter count={momentsTotal} />

      <div
        role="tablist"
        aria-label="Activity type"
        className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {tabs.map((tab) => {
          const active = filter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => changeFilter(tab.id)}
              className={cn(
                'inline-flex min-h-[40px] shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors',
                active
                  ? 'bg-navy text-white'
                  : 'border border-border bg-card text-ink/80 hover:bg-muted',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {feed.length === 0 ? (
        <p className="mt-10 text-lg text-ink/70">{t.community.emptyFilter}</p>
      ) : (
        <div className="mt-8 flex items-start gap-5">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-5">
              {column.map(({ item: entry, index: i }) => (
                <FadeRise key={entry.key} delayMs={(i % 6) * 60}>
                  {entry.kind === 'story' ? (
                    <StoryCard story={entry.story} />
                  ) : entry.kind === 'instagram' ? (
                    <InstagramCard embed={entry.embed} />
                  ) : (
                    <KnowledgeCard item={entry.knowledge} />
                  )}
                </FadeRise>
              ))}
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <nav
          aria-label={t.community.momentsLabel}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-navy/20 bg-card px-6 text-base font-semibold text-navy transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t.community.pagePrev}
            </button>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= pageCount - 1}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-navy/20 bg-card px-6 text-base font-semibold text-navy transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t.community.pageNext}
            </button>
          </div>
          {/* aria-live because the cards swap out silently — without it a screen
              reader user gets no confirmation the page actually changed. */}
          <p aria-live="polite" className="text-sm text-navy/55">
            {t.community.showingRange
              .replace('{from}', from)
              .replace('{to}', to)
              .replace('{total}', total)}
          </p>
        </nav>
      )}
    </section>
  )
}
