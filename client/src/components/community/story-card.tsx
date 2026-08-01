import { useState } from 'react'
import { useSite } from '@/components/site-provider'
import type { Story } from '@/lib/mock'
import { cn } from '@/lib/utils'

// Real Love 21 moment photos — rotated by story id, not tied 1:1 to the story
// text. member.jpg is excluded (Zoom-call screenshot with real names visible).
const STORY_IMAGES = [
  '/brand/hero-group.jpg',
  '/brand/hero-huddle.jpg',
  '/brand/activity.jpg',
  '/brand/class.jpg',
] as const

function photoFor(id: string) {
  const n = Number.parseInt(id.replace(/\D/g, ''), 10) || 0
  return STORY_IMAGES[n % STORY_IMAGES.length]
}

export function StoryCard({ story }: { story: Story }) {
  const { locale, t } = useSite()
  const [revealed, setRevealed] = useState(false)

  return (
    <article
      role="button"
      tabIndex={0}
      aria-expanded={revealed}
      aria-label={t.community.revealPrompt}
      onClick={() => setRevealed((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setRevealed((v) => !v)
        }
      }}
      className="group relative break-inside-avoid cursor-pointer overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {/* Photo is a de-emphasised corner accent, not the headline. */}
      <img
        src={photoFor(story.id)}
        alt=""
        className="absolute top-5 right-5 h-14 w-14 rounded-full object-cover opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0"
      />

      {/* Ability first, large — the headline of the card. */}
      <h3 className="max-w-[80%] font-display text-2xl leading-tight font-extrabold text-navy text-balance">
        {story.title[locale]}
      </h3>

      {/* Who + context reveal on hover (desktop) or tap (mobile) — not shown by default. */}
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
          'group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-visible:grid-rows-[1fr] group-focus-visible:opacity-100',
          revealed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <p className="kicker mt-3 text-teal">{t.community.filters[story.type]}</p>
          <p className="mt-2 text-base leading-relaxed text-ink/85">{story.line[locale]}</p>
          <p className="mt-3 font-mono text-xs tracking-wide text-navy/55">
            {t.community.toldBy}{' '}
            <span className="font-semibold text-navy">{story.author}</span>
          </p>
        </div>
      </div>
    </article>
  )
}
