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
    const duration = 1200
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
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
      { threshold: 0.2 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="stats"
      aria-label={t.stats.title}
      className="scroll-mt-20 bg-navy text-white"
    >
      <div ref={ref} className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8 sm:py-14">
        <p className="kicker text-yellow">{t.stats.title}</p>
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 md:gap-8">
          {t.stats.items.map((item) => (
            <div key={item.label}>
              <p className="font-display text-[clamp(2rem,5vw,3rem)] leading-none font-extrabold break-words text-yellow">
                <CountUp
                  value={item.value}
                  suffix={item.suffix}
                  play={play}
                  reduced={reduced}
                />
                <span className="sr-only">
                  {item.value.toLocaleString()}
                  {item.suffix} {item.label}
                </span>
              </p>
              <p className="mt-3 text-[14px] leading-snug font-medium text-white/80 sm:text-[15px]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-[12px] tracking-wide text-white/50 uppercase">
          {t.stats.updated}
        </p>
      </div>
    </section>
  )
}
