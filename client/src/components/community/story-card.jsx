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
    const target = track?.children[i]
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
    setActive(i)
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget
          const idx = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1))
          if (idx !== active) setActive(idx)
        }}
      >
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === 0 ? alt : ''}
            className="aspect-[4/5] w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${t.community.imageLabel} ${i + 1}/${images.length}`}
              aria-current={i === active}
              onClick={() => goTo(i)}
              className={cn(
                'h-1.5 rounded-full bg-white/50 transition-all',
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

  return (
    <article className="break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
            {/* Secondary metadata — never competes with the achievement headline below. */}
            <p className="text-xs text-navy/45">{timeAgo}</p>
          </div>
        </div>
        <span className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-semibold', tagStyle[story.accent])}>
          {t.community.filters[story.type]}
        </span>
      </div>

      <ImageCarousel images={story.images} alt={t.community.photoAlt} />

      <div className="px-4 pt-3">
        <CelebrateButton initialCount={story.celebrateCount} />
      </div>

      {/* Ability first, large — the headline of the post. */}
      <div className="px-4 pt-3 pb-4">
        <h3 className="font-display text-xl leading-snug font-extrabold text-navy text-balance">
          {story.title[locale]}
        </h3>
        <p className="mt-1.5 text-base leading-relaxed text-ink/85">{story.line[locale]}</p>
      </div>
    </article>
  )
}
