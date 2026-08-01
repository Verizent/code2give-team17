import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * UK Easy Read layout: picture on the left, words on the right.
 * One idea per short sentence in `children`.
 */
export function EasyReadRow({
  imageSrc,
  imageAlt,
  children,
  className,
}: {
  imageSrc: string
  imageAlt: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'easy-read-row grid items-start gap-4 sm:grid-cols-[minmax(7rem,11rem)_minmax(0,1fr)] sm:gap-6',
        className,
      )}
    >
      <div className="easy-read-pic mx-auto w-full max-w-[11rem] overflow-hidden rounded-md border-2 border-navy/15 bg-white sm:mx-0">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="aspect-square h-auto w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="easy-read-words min-w-0 space-y-3 text-left">{children}</div>
    </div>
  )
}

/** Split plain text into one short paragraph per sentence (UK Easy Read). */
export function EasyReadSentences({ text, className }: { text: string; className?: string }) {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <>
      {parts.map((sentence, i) => (
        <p key={i} className={cn('max-w-[40rem] text-[1.05em] leading-[1.7] text-[#1a1a1a]', className)}>
          {sentence}
        </p>
      ))}
    </>
  )
}
