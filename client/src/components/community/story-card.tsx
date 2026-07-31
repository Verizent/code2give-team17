import { useSite } from '@/components/site-provider'
import type { Story } from '@/lib/mock'
import { cn } from '@/lib/utils'

const photoTone: Record<Story['accent'], string> = {
  teal: 'from-teal/35 via-sage to-paper',
  pink: 'from-pink/50 via-muted to-paper',
  yellow: 'from-yellow/40 via-muted to-paper',
  navy: 'from-navy/30 via-sage to-paper',
}

const photoH: Record<Story['photoH'], string> = {
  sm: 'h-28',
  md: 'h-40',
  lg: 'h-52',
}

export function StoryCard({ story }: { story: Story }) {
  const { locale, t } = useSite()

  return (
    <article className="group break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-transform duration-300 hover:-translate-y-1">
      <div
        className={cn(
          'relative w-full bg-gradient-to-br',
          photoTone[story.accent],
          photoH[story.photoH],
        )}
        aria-hidden="true"
      >
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-[0.2em] text-navy/35 uppercase">
          photo
        </span>
      </div>
      <div className="p-5">
        <p className="kicker text-teal">{t.community.filters[story.type]}</p>
        <h3 className="mt-2 font-display text-xl leading-snug font-bold text-navy text-balance">
          {story.title[locale]}
        </h3>
        <p className="mt-2 text-base leading-relaxed text-ink/85">
          {story.line[locale]}
        </p>
        <p className="mt-4 font-mono text-xs tracking-wide text-navy/55">
          {t.community.toldBy}{' '}
          <span className="font-semibold text-navy">{story.author}</span>
        </p>
      </div>
    </article>
  )
}
