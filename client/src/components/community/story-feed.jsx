import { useEffect, useRef, useState } from 'react'
import { useSite } from '@/components/site-provider'
import { ACTIVITY_TYPES, MOMENTS_OF_ABILITY_COUNT, knowledgeStats, stories } from '@/lib/mock'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { FadeRise } from '@/components/community/fade-rise'
import { StoryCard } from '@/components/community/story-card'
import { KnowledgeCard } from '@/components/community/knowledge-card'

/** Count-up header for the Ability Wall. Plays once, on first scroll into view. */
function MomentsCounter() {
  const { t } = useSite()
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const [display, setDisplay] = useState(reduced ? MOMENTS_OF_ABILITY_COUNT : 0)

  useEffect(() => {
    const node = ref.current
    if (!node || reduced) {
      setDisplay(MOMENTS_OF_ABILITY_COUNT)
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
          setDisplay(Math.round(eased * MOMENTS_OF_ABILITY_COUNT))
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      },
      { threshold: 0.3 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [reduced])

  return (
    <p
      ref={ref}
      className="font-display text-[clamp(1.5rem,4vw,2.25rem)] font-bold text-navy"
    >
      <span aria-hidden="true">{display.toLocaleString()}</span>
      <span className="sr-only">{MOMENTS_OF_ABILITY_COUNT.toLocaleString()}</span>{' '}
      {t.community.momentsLabel}
    </p>
  )
}

function buildFeed(filter) {
  const filtered =
    filter === 'all' ? stories : stories.filter((s) => s.type === filter)

  const entries = []
  let storyCount = 0

  for (const story of filtered) {
    entries.push({ key: `story-${story.id}`, kind: 'story', story })
    storyCount += 1

    // Knowledge cards only in the full feed — they educate the whole community
    if (filter === 'all') {
      for (const k of knowledgeStats) {
        if (k.afterStoryCount === storyCount) {
          entries.push({ key: `know-${k.id}`, kind: 'knowledge', knowledge: k })
        }
      }
    }
  }

  return entries
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
  const { t } = useSite()
  const [filter, setFilter] = useState('all')
  const feed = buildFeed(filter)
  const columnCount = useMasonryColumnCount()
  const columns = splitIntoColumns(feed, columnCount)

  const tabs = [
    { id: 'all', label: t.community.filterAll },
    ...ACTIVITY_TYPES.map((id) => ({ id, label: t.community.filters[id] })),
  ]

  return (
    <section aria-labelledby="feed-title" className="mt-14">
      <h2 id="feed-title" className="sr-only">
        Story feed
      </h2>

      <MomentsCounter />

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
              onClick={() => setFilter(tab.id)}
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
                  ) : (
                    <KnowledgeCard item={entry.knowledge} />
                  )}
                </FadeRise>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
