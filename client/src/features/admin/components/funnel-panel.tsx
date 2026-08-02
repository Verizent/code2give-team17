import type { FunnelPayload } from '@/features/admin/api'
import { cn } from '@/lib/utils'

const STAGE_COLORS = ['bg-navy', 'bg-teal', 'bg-teal/80', 'bg-red/80', 'bg-red']

export function FunnelPanel({
  funnel,
  copy,
}: {
  funnel: FunnelPayload
  copy: {
    title: string
    intro: string
    dropoffs: string
    sources: string
    sourcesHint: string
    empty: string
    sourcesEmpty: string
  }
}) {
  const max = Math.max(...funnel.stages.map((s) => s.count), 1)
  return (
    <section aria-labelledby="funnel-heading" className="mt-12 border-t border-navy/10 pt-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-red">Conversion</p>
        <h2 id="funnel-heading" className="mt-1 font-display text-2xl font-semibold text-navy">
          {copy.title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-navy/65">
          {copy.intro} ({funnel.period_label}).
        </p>
        {funnel.note ? (
          <p className="mt-2 max-w-2xl text-xs text-navy/50">{funnel.note}</p>
        ) : null}
      </div>

      {funnel.empty ? (
        <p className="mt-8 text-sm text-navy/55">{copy.empty}</p>
      ) : (
        <>
          <ol className="mt-8 space-y-3">
            {funnel.stages.map((stage, i) => {
              const width = Math.max(12, Math.round((stage.count / max) * 100))
              return (
                <li key={stage.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-navy">
                      <span
                        className={cn('mr-2 inline-block h-2.5 w-2.5 rounded-sm', STAGE_COLORS[i])}
                        aria-hidden
                      />
                      {stage.label}
                    </span>
                    <span className="tabular-nums text-navy/70">
                      {stage.count.toLocaleString()}
                      {stage.conversion_from_prev != null && stage.count > 0 && (
                        <span className="ml-2 text-teal">
                          {stage.conversion_from_prev}% from previous
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 h-3 w-full rounded-sm bg-navy/5" aria-hidden>
                    <div
                      className={cn('h-3 rounded-sm', STAGE_COLORS[i])}
                      style={{ width: stage.count === 0 ? '0%' : `${width}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-navy">{copy.dropoffs}</h3>
              <ul className="mt-3 divide-y divide-navy/10 border-y border-navy/10">
                {[...funnel.dropoffs]
                  .sort((a, b) => b.lost - a.lost)
                  .slice(0, 3)
                  .map((d) => (
                    <li key={`${d.from}-${d.to}`} className="flex justify-between gap-3 py-3 text-sm">
                      <span className="text-navy/80">
                        {d.from_label} → {d.to_label}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-navy">
                        −{d.lost.toLocaleString()}
                        <span className="ml-1 font-normal text-navy/50">({d.rate}%)</span>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-navy">{copy.sources}</h3>
              <p className="mt-1 text-xs text-navy/50">{copy.sourcesHint}</p>
              {funnel.sources.length === 0 ? (
                <p className="mt-3 text-sm text-navy/55">{copy.sourcesEmpty}</p>
              ) : (
                <ul className="mt-3 divide-y divide-navy/10 border-y border-navy/10">
                  {funnel.sources.map((s) => (
                    <li key={s.source} className="py-3 text-sm">
                      <p className="font-semibold text-navy">{s.label}</p>
                      <p className="mt-0.5 text-navy/60">
                        {s.volunteers} volunteers · {s.donors} donors
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
