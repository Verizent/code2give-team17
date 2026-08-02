import { useEffect, useRef, useState } from 'react'
import { useSite } from '@/components/site-provider'
import { ACTIVITY_TYPES, MOMENTS_OF_ABILITY_COUNT, knowledgeStats, stories } from '@/lib/mock'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { FadeRise } from '@/components/community/fade-rise'
import { StoryCard } from '@/components/community/story-card'
import { KnowledgeCard } from '@/components/community/knowledge-card'
import { InstagramCard } from '@/components/community/instagram-card'
import { listVoices, listInstagram } from '@/features/content/api'
import { mapVoice } from '@/features/content/map-voice'

/** Stories shown before "Show more"; also the size of each subsequent reveal. */
const PAGE_SIZE = 10
/**
 * An embed with display_order N lands after story N × this. Spreading them out beats
 * placing them at story N, which would bunch all three at the top — but the product
 * must divide into PAGE_SIZE, or an embed lands past the fold and is invisible until
 * the visitor expands. At 3, orders 1–3 sit after stories 3, 6 and 9.
 */
const EMBED_SPACING = 3

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

function buildFeed(filter, voices, embeds, limit) {
  const curated =
    filter === 'all' ? stories : stories.filter((s) => s.type === filter)

  // Submitted posts have no activity type, so they belong to the unfiltered wall only.
  // Including them under a programme tab would assert a programme nobody recorded.
  const ordered =
    filter === 'all'
      ? [...voices, ...curated].sort(
          (a, b) => new Date(b.postedAt) - new Date(a.postedAt),
        )
      : curated

  // The limit counts stories, not cards: knowledge and Instagram cards are furniture
  // between them, so counting those would make "show more" reveal fewer stories the
  // further down you got.
  const filtered = ordered.slice(0, limit)

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
      // display_order is the admin's intent for placement, so it drives position here
      // rather than being sorted by date like a story — an embed has no post date.
      for (const embed of embeds) {
        if (embed.display_order * EMBED_SPACING === storyCount) {
          entries.push({ key: `ig-${embed.id}`, kind: 'instagram', embed })
        }
      }
    }
  }

  return { entries, total: ordered.length, shown: filtered.length }
}

export function StoryFeed() {
  const { locale, t } = useSite()
  const [filter, setFilter] = useState('all')
  const [voices, setVoices] = useState([])
  const [embeds, setEmbeds] = useState([])
  const [limit, setLimit] = useState(PAGE_SIZE)

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

  const { entries: feed, total, shown } = buildFeed(filter, voices, embeds, limit)

  function changeFilter(id) {
    setFilter(id)
    // Without this, switching to a tab with three stories keeps a limit of forty and
    // the "show more" state reads as though the visitor had already expanded it.
    setLimit(PAGE_SIZE)
  }

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
        <div className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {feed.map((entry, i) => (
            <FadeRise
              key={entry.key}
              delayMs={(i % 6) * 60}
              className="mb-5"
            >
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
      )}

      {shown < total && (
        <div className="mt-10 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE_SIZE)}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-navy/20 bg-card px-6 text-base font-semibold text-navy transition-colors hover:bg-muted"
          >
            {t.community.showMore}
          </button>
          {/* aria-live so a screen reader hears the count change after each reveal,
              which is otherwise silent — the new cards are appended off-screen. */}
          <p aria-live="polite" className="text-sm text-navy/55">
            {t.community.showingCount.replace('{n}', shown).replace('{total}', total)}
          </p>
        </div>
      )}
    </section>
  )
}
