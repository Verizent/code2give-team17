import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Pause, Play } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { mediaItems } from '@/lib/mock'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 6000

/**
 * Real press/media coverage from love21foundation.com/media — auto-advancing
 * hero carousel. Autoplay is off entirely under prefers-reduced-motion; a
 * manual pause/play toggle is always available (WCAG 2.2.2).
 */
export function MediaCarousel() {
  const { locale, t } = useSite()
  const reducedMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(!reducedMotion)
  const [hovering, setHovering] = useState(false)
  const total = mediaItems.length

  const goTo = (i) => setActive(((i % total) + total) % total)
  const next = () => goTo(active + 1)
  const prev = () => goTo(active - 1)

  useEffect(() => {
    if (!playing || hovering || reducedMotion) return
    const id = window.setInterval(next, AUTOPLAY_MS)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, playing, hovering, reducedMotion])

  const item = mediaItems[active]

  return (
    <section aria-labelledby="media-news-title" className="mt-14">
      <p className="kicker text-teal">{t.mediaNews.eyebrow}</p>
      <h2
        id="media-news-title"
        className="mt-2 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold tracking-[-0.02em] text-navy"
      >
        {t.mediaNews.title}
      </h2>
      <p className="section-lede mt-2 max-w-xl text-base leading-relaxed text-navy/70 sm:text-lg">
        {t.mediaNews.subhead}
      </p>

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={t.mediaNews.title}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
        className="relative mt-6 h-[380px] overflow-hidden rounded-2xl sm:h-[440px]"
      >
        {mediaItems.map((slide, i) => (
          <div
            key={slide.id}
            aria-hidden={i !== active}
            className={cn(
              'absolute inset-0 transition-opacity duration-700 ease-out',
              i === active ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <img
              src={slide.image}
              alt=""
              className="h-full w-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/55 to-transparent" />
          </div>
        ))}

        {/* Live region announces the current slide for screen readers without a full re-render storm. */}
        <div className="absolute right-0 bottom-0 left-0 p-5 text-white sm:p-8" aria-live={hovering ? 'off' : 'polite'}>
          <p className="text-sm font-medium text-white/75">{item.date[locale]}</p>
          <h3 className="mt-1 line-clamp-2 max-w-2xl text-xl leading-snug font-bold text-balance text-white sm:text-3xl">
            {item.title[locale]}
          </h3>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white sm:text-base"
          >
            {t.mediaNews.readMore}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          onClick={prev}
          aria-label={t.mediaNews.prevSlide}
          className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-navy/40 text-white backdrop-blur-sm transition-colors hover:bg-navy/60"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label={t.mediaNews.nextSlide}
          className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-navy/40 text-white backdrop-blur-sm transition-colors hover:bg-navy/60"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="absolute right-4 bottom-4 flex items-center gap-3 sm:right-8 sm:bottom-8">
          <div className="flex items-center gap-1.5">
            {mediaItems.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={t.mediaNews.slideLabel.replace('{n}', i + 1).replace('{total}', total)}
                aria-current={i === active}
                onClick={() => goTo(i)}
                className={cn(
                  'h-1.5 rounded-full bg-white/50 transition-all',
                  i === active ? 'w-4 bg-white' : 'w-1.5',
                )}
              />
            ))}
          </div>
          {!reducedMotion && (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? t.mediaNews.pause : t.mediaNews.play}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-navy/40 text-white backdrop-blur-sm hover:bg-navy/60"
            >
              {playing ? (
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
