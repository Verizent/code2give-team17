import { useEffect, useMemo, useRef, useState } from 'react'
import { useSite } from '@/components/site-provider'
import {
  ACTIVITY_TYPES,
  MOMENTS_OF_ABILITY_COUNT,
  knowledgeStats,
  stories,
  type ActivityType,
  type KnowledgeStat,
  type Story,
} from '@/lib/mock'
import { cn } from '@/lib/utils'
import { FadeRise } from '@/components/community/fade-rise'
import { StoryCard } from '@/components/community/story-card'
import { KnowledgeCard } from '@/components/community/knowledge-card'

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = () => setReduced(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

/** Count-up header for the Ability Wall. Plays once, on first scroll into view. */
function MomentsCounter() {
  const { t } = useSite()
  const reduced = useReducedMotion()
  const ref = useRef<HTMLParagraphElement>(null)
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
        const step = (now: number) => {
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

type FeedEntry =
  | { key: string; kind: 'story'; story: Story }
  | { key: string; kind: 'knowledge'; knowledge: KnowledgeStat }

function buildFeed(filter: ActivityType | 'all'): FeedEntry[] {
  const filtered =
    filter === 'all' ? stories : stories.filter((s) => s.type === filter)

  const entries: FeedEntry[] = []
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

export function StoryFeed() {
  const { t } = useSite()
  const [filter, setFilter] = useState<ActivityType | 'all'>('all')
  const feed = useMemo(() => buildFeed(filter), [filter])

  const tabs: { id: ActivityType | 'all'; label: string }[] = [
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
        <div className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {feed.map((entry, i) => (
            <FadeRise
              key={entry.key}
              delayMs={(i % 6) * 60}
              className="mb-5"
            >
              {entry.kind === 'story' ? (
                <StoryCard story={entry.story} />
              ) : (
                <KnowledgeCard item={entry.knowledge} />
              )}
            </FadeRise>
          ))}
        </div>
      )}
    </section>
  )
}
