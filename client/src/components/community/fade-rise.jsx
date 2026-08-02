import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export function FadeRise({ children, className, delayMs = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Outer owns layout size and never carries a transform. Transforms on the
  // layout box make engines (Safari especially) under-count height / fail to
  // clip so media paints over following sections. Inner owns motion; overflow
  // clips the pre-visible translate so paint cannot escape the reserved box.
  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <div
        className={cn(
          'transition-[opacity,transform] duration-500 ease-out',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        )}
        style={{ transitionDelay: visible ? `${delayMs}ms` : '0ms' }}
      >
        {children}
      </div>
    </div>
  )
}
