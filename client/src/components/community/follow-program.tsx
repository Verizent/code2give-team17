import { useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { followPrograms, type FollowProgram } from '@/lib/mock'
import { cn } from '@/lib/utils'

const accentDot: Record<FollowProgram['accent'], string> = {
  teal: 'bg-teal',
  pink: 'bg-pink',
  yellow: 'bg-yellow',
  navy: 'bg-navy',
}

export function FollowProgramPanel() {
  const { locale, t } = useSite()
  const [following, setFollowing] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setFollowing((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section
      aria-labelledby="follow-title"
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-navy">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2
            id="follow-title"
            className="font-display text-xl font-bold text-navy sm:text-2xl"
          >
            {t.community.followTitle}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/75 sm:text-base">
            {t.community.followSubhead}
          </p>
        </div>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {followPrograms.map((program) => {
          const on = following.has(program.id)
          return (
            <li key={program.id}>
              <div className="flex h-full flex-col rounded-xl border border-border bg-paper/60 p-4">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cn('h-2.5 w-2.5 rounded-full', accentDot[program.accent])}
                  />
                  <p className="font-display text-lg font-bold text-navy">
                    {program.name[locale]}
                  </p>
                </div>
                <p className="mt-1.5 flex-1 text-sm text-ink/75">
                  {program.blurb[locale]}
                </p>
                <button
                  type="button"
                  onClick={() => toggle(program.id)}
                  aria-pressed={on}
                  className={cn(
                    'mt-3 inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors',
                    on
                      ? 'bg-teal text-white'
                      : 'border border-border bg-card text-navy hover:bg-muted',
                  )}
                >
                  {on ? (
                    <BellRing className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Bell className="h-4 w-4" aria-hidden="true" />
                  )}
                  {on ? t.community.followingCta : t.community.followCta}
                </button>
                {on && (
                  <p className="mt-2 text-xs text-teal">{t.community.followNotify}</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
