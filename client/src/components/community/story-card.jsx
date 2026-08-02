import { useRef, useState } from 'react'
import { PartyPopper } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { cn, formatRelativeTime } from '@/lib/utils'

const avatarStyle = {
  teal: 'bg-teal/15 text-teal',
  pink: 'bg-pink/40 text-navy',
  yellow: 'bg-yellow/50 text-navy',
  navy: 'bg-navy/10 text-navy',
}

const tagStyle = {
  teal: 'bg-teal/10 text-teal',
  pink: 'bg-pink/25 text-navy',
  yellow: 'bg-yellow/30 text-navy',
  navy: 'bg-navy/10 text-navy',
}

const CONFETTI_COLORS = ['#e4002b', '#ffc72c', '#00857d', '#f5a3b6', '#14284b']
const CONFETTI_COUNT = 9

function ImageCarousel({ images, alt }) {
  const { t } = useSite()
  const [active, setActive] = useState(0)
  const trackRef = useRef(null)

  function goTo(i) {
    const track = trackRef.current
    if (!track) return
    // scrollLeft only — scrollIntoView can scroll page ancestors.
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' })
    setActive(i)
  }

  // Safari: an aspect-ratio box whose ONLY children are position:absolute often
  // collapses (or fails to clip), so portrait JPEGs paint at intrinsic 768×1024
  // over ArticlesCta. Keep an in-flow sizer for height; fill with an absolute track.
  return (
    <div className="relative w-full overflow-hidden [contain:layout_paint]">
      <div className="aspect-[4/5] w-full" aria-hidden="true" />
      <div
        ref={trackRef}
        className="no-scrollbar absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
        onScroll={(e) => {
          const el = e.currentTarget
          const idx = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1))
          if (idx !== active) setActive(idx)
        }}
      >
        {images.map((src, i) => (
          <div
            key={src}
            className="relative h-full min-w-full shrink-0 snap-center overflow-hidden"
          >
            <img
              src={src}
              alt={i === 0 ? alt : ''}
              draggable={false}
              className="pointer-events-none h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${t.community.imageLabel} ${i + 1}/${images.length}`}
              aria-current={i === active}
              onClick={() => goTo(i)}
              className={cn(
                'pointer-events-auto h-1.5 rounded-full bg-white/50 transition-all',
                i === active ? 'w-4 bg-white' : 'w-1.5',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CelebrateButton({ initialCount }) {
  const { t } = useSite()
  const reducedMotion = useReducedMotion()
  const [celebrated, setCelebrated] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [burstId, setBurstId] = useState(null)

  // Fixed per-card so repeat celebrates reuse the same tasteful spread.
  // No reactive inputs (module-level constants only) — React Compiler
  // caches this across re-renders the same way useMemo(..., []) did.
  const particles = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const angle = (i / CONFETTI_COUNT) * Math.PI * 2 + Math.random() * 0.5
    const distance = 22 + Math.random() * 16
    return {
      tx: `${Math.cos(angle) * distance}px`,
      ty: `${Math.sin(angle) * distance - 8}px`,
      tr: `${Math.round(Math.random() * 360)}deg`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }
  })

  function toggle() {
    const next = !celebrated
    setCelebrated(next)
    setCount((c) => c + (next ? 1 : -1))
    if (next && !reducedMotion) {
      const id = Date.now()
      setBurstId(id)
      window.setTimeout(() => setBurstId((cur) => (cur === id ? null : cur)), 650)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={celebrated}
      className={cn(
        'relative inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors',
        celebrated
          ? 'border-red/30 bg-red/10 text-red'
          : 'border-border bg-card text-navy/70 hover:bg-muted',
      )}
    >
      <PartyPopper className="h-4 w-4" aria-hidden="true" />
      {t.community.celebrateCta} · {count.toLocaleString()}
      {burstId !== null && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
          {particles.map((p, i) => (
            <span
              key={`${burstId}-${i}`}
              className="confetti-piece"
              style={{
                '--tx': p.tx,
                '--ty': p.ty,
                '--tr': p.tr,
                background: p.color,
              }}
            />
          ))}
        </span>
      )}
    </button>
  )
}

export function StoryCard({ story }) {
  const { locale, t } = useSite()
  const timeAgo = formatRelativeTime(story.postedAt, t.community)
  const isSubmitted = story.source === 'community'

  // `relationship` is any non-empty string server-side, so an unrecognised value
  // falls back to itself rather than rendering "undefined" on the card.
  const relationshipLabel = t.community.relationships[story.relationship] ?? story.relationship

  // The pill is the activity type on every card, submitted or curated, because that is
  // what the filter tabs act on — a pill you cannot filter by is a lie about the wall.
  // A submission without one (older rows) falls back to showing who wrote it.
  const tagLabel = story.type
    ? t.community.filters[story.type]
    : isSubmitted
      ? relationshipLabel
      : null

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm [contain:layout_paint]">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
              avatarStyle[story.accent],
            )}
          >
            {story.author.charAt(0)}
          </span>
          <div>
            <p className="font-semibold text-navy">{story.author}</p>
            {/* Secondary metadata — never competes with the achievement headline below.
                Relationship moved here once the pill became the activity type, so a
                submission still says who wrote it. */}
            <p className="text-xs text-navy/45">
              {isSubmitted && story.type ? `${timeAgo} · ${relationshipLabel}` : timeAgo}
            </p>
          </div>
        </div>
        {tagLabel && (
          <span
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
              tagStyle[story.accent],
            )}
          >
            {tagLabel}
          </span>
        )}
      </div>

      {story.images.length > 0 && (
        <ImageCarousel images={story.images} alt={t.community.photoAlt} />
      )}

      <div className="px-4 pt-3">
        <CelebrateButton initialCount={story.celebrateCount} />
      </div>

      {isSubmitted ? (
        // A submitted post has no title and one language — the submitter's own. Rendered
        // at body size so it never impersonates a curated achievement headline.
        <div className="px-4 pt-3 pb-4">
          <p className="text-base leading-relaxed text-ink/85">{story.story}</p>
        </div>
      ) : (
        /* Ability first, large — the headline of the post. */
        <div className="px-4 pt-3 pb-4">
          <h3 className="font-display text-xl leading-snug font-extrabold text-navy text-balance">
            {story.title[locale]}
          </h3>
          <p className="mt-1.5 text-base leading-relaxed text-ink/85">{story.line[locale]}</p>
        </div>
      )}
    </article>
  )
}
