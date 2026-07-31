'use client'

import { useMemo, useState } from 'react'
import { useSite } from '@/components/site-provider'
import {
  ACTIVITY_TYPES,
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

      <div
        role="tablist"
        aria-label="Activity type"
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
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
