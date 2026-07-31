import { useEffect, useRef, useState } from 'react'
import { useSite } from '@/components/site-provider'

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

function CountUp({
  value,
  suffix,
  play,
  reduced,
}: {
  value: number
  suffix: string
  play: boolean
  reduced: boolean
}) {
  const [display, setDisplay] = useState(reduced ? value : 0)

  useEffect(() => {
    if (!play) return
    if (reduced) {
      setDisplay(value)
      return
    }
    let raf = 0
    const duration = 1400
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [play, reduced, value])

  return (
    <span aria-hidden="true">
      {display.toLocaleString()}
      {suffix}
    </span>
  )
}

export function StatsBand() {
  const { t } = useSite()
  const reduced = useReducedMotion()
  const [play, setPlay] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setPlay(true)
            observer.disconnect()
          }
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="stats"
      aria-labelledby="stats-title"
      className="scroll-mt-20 bg-navy text-white"
    >
      <div ref={ref} className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="kicker flex items-center gap-2 text-yellow">
          <span
            className="inline-block h-2 w-2 rounded-full bg-red"
            aria-hidden="true"
          />
          Live impact
        </p>
        <h2
          id="stats-title"
          className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl"
        >
          {t.stats.title}
        </h2>

        <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {t.stats.items.map((item, i) => (
            <div
              key={item.label}
              className="border-t border-white/15 pt-5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <dt className="sr-only">{item.label}</dt>
              <dd className="font-display text-5xl font-bold tabular-nums text-yellow sm:text-6xl">
                <CountUp
                  value={item.value}
                  suffix={item.suffix}
                  play={play}
                  reduced={reduced}
                />
                <span className="sr-only">
                  {item.value.toLocaleString()}
                  {item.suffix}
                </span>
              </dd>
              <p className="mt-3 text-base leading-snug font-medium text-white/80">
                {item.label}
              </p>
            </div>
          ))}
        </dl>

        <p className="mt-12 font-mono text-xs tracking-wide text-white/55">
          {t.stats.updated}
        </p>
      </div>
    </section>
  )
}
