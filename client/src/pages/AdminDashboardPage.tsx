import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchAdminDashboard,
  fetchAdminFunnel,
  type DashboardPayload,
  type FunnelPayload,
} from '@/features/admin/api'
import { useSite } from '@/components/site-provider'
import { ApiError } from '@/lib/apiClient'
import { cn } from '@/lib/utils'

function formatMonth(month: string) {
  const [y, m] = month.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[Number(m) - 1] ?? m} ${y?.slice(2) ?? ''}`
}

function BarChart({
  label,
  description,
  unitLabel,
  emptyLabel,
  values,
  valueKey,
  formatValue,
}: {
  label: string
  description: string
  unitLabel: string
  emptyLabel: string
  values: Array<Record<string, string | number>>
  valueKey: string
  formatValue: (n: number) => string
}) {
  const nums = values.map((row) => Number(row[valueKey]) || 0)
  const max = Math.max(...nums, 1)
  const total = nums.reduce((sum, n) => sum + n, 0)
  const empty = total === 0

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-navy">{label}</h3>
        <p className="text-sm font-semibold text-teal">
          {formatValue(total)}
          <span className="ml-1 font-normal text-navy/50">· 6 mo total</span>
        </p>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-navy/65">{description}</p>
      {empty ? (
        <p className="mt-6 text-sm text-navy/55">{emptyLabel}</p>
      ) : (
        <>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-navy/45">{unitLabel}</p>
          <ul className="mt-3 flex items-end gap-2" aria-label={label}>
            {values.map((row) => {
              const n = Number(row[valueKey]) || 0
              const h = Math.max(8, Math.round((n / max) * 120))
              return (
                <li key={String(row.month)} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <span className="max-w-full truncate text-[10px] font-semibold tabular-nums text-navy/70">
                    {formatValue(n)}
                  </span>
                  <div
                    className="w-full max-w-10 rounded-t-md bg-teal/85"
                    style={{ height: h }}
                    title={`${formatMonth(String(row.month))}: ${formatValue(n)}`}
                  />
                  <span className="text-[11px] font-medium text-navy/55">
                    {formatMonth(String(row.month))}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

const STAGE_COLORS = ['bg-navy', 'bg-teal', 'bg-teal/80', 'bg-red/80', 'bg-red']

function FunnelPanel({
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

export function AdminDashboardPage() {
  const { t } = useSite()
  const a = t.admin
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [funnel, setFunnel] = useState<FunnelPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const [dash, fun] = await Promise.all([
        fetchAdminDashboard(),
        fetchAdminFunnel().catch(() => null),
      ])
      setData(dash)
      setFunnel(fun)
      setError(null)
    } catch (err) {
      setError(
        err instanceof ApiError ? 'Could not load dashboard.' : 'Could not load dashboard.',
      )
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (error) {
    return (
      <p role="alert" className="rounded-md bg-red/10 px-3 py-2 text-sm text-red">
        {error}
      </p>
    )
  }

  if (!data) {
    return <p className="text-navy/70">…</p>
  }

  const { metrics, charts, queue } = data
  const tiles = [
    {
      label: a.dashboardTileDonations,
      value: `HK$${metrics.donations_total_hkd.toLocaleString()}`,
      hint:
        metrics.donations_count === 0
          ? a.dashboardGiftsEmpty
          : a.dashboardGiftsHint.replace('{n}', String(metrics.donations_count)),
    },
    {
      label: a.dashboardTileSessions,
      value: String(metrics.volunteer_sessions_upcoming),
      hint: a.dashboardSpotsHint.replace('{n}', String(metrics.volunteer_spots_open)),
    },
    {
      label: a.dashboardTileInterests,
      value: String(metrics.interests_count),
      hint: a.dashboardInterestsHint,
    },
    {
      label: a.dashboardTilePending,
      value: String(metrics.pending_campaigns + metrics.pending_voices),
      hint: a.dashboardPendingHint,
    },
  ]

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">{a.dashboardTitle}</h1>
      <p className="mt-2 max-w-2xl text-navy/70">{a.dashboardIntro}</p>

      <section aria-label="Key metrics" className="mt-8 border-b border-navy/10 pb-6">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <li key={tile.label}>
              <p className="text-xs font-bold uppercase tracking-wide text-navy/50">{tile.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold text-navy">{tile.value}</p>
              <p className="mt-1 text-sm text-navy/60">{tile.hint}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 grid gap-10 lg:grid-cols-2">
        <BarChart
          label={a.dashboardChartMoney}
          description={a.dashboardChartMoneyDesc}
          unitLabel={a.dashboardChartMoneyUnit}
          emptyLabel={a.dashboardChartMoneyEmpty}
          values={charts.donations_by_month}
          valueKey="amount_hkd"
          formatValue={(n) => {
            if (n >= 10_000) return `HK$${(n / 1000).toFixed(0)}k`
            if (n >= 1000) return `HK$${(n / 1000).toFixed(1)}k`
            return `HK$${n.toLocaleString()}`
          }}
        />
        <BarChart
          label={a.dashboardChartHours}
          description={a.dashboardChartHoursDesc}
          unitLabel={a.dashboardChartHoursUnit}
          emptyLabel={a.dashboardChartHoursEmpty}
          values={charts.volunteer_hours_by_month}
          valueKey="hours"
          formatValue={(n) => `${n}h`}
        />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-navy">{a.dashboardQueueTitle}</h2>
        <p className="mt-1 text-sm text-navy/65">{a.dashboardQueueIntro}</p>
        <ul className="mt-4 divide-y divide-navy/10 border-y border-navy/10">
          {queue.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy">
                  {item.title}
                  {item.count != null ? (
                    <span className="ml-2 text-teal">({item.count})</span>
                  ) : null}
                </p>
                <p className="text-sm text-navy/65">{item.detail}</p>
              </div>
              <Link
                to={item.href}
                className="inline-flex min-h-11 shrink-0 items-center font-semibold text-teal underline-offset-4 hover:underline"
              >
                {a.dashboardQueueOpen}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {funnel && (
        <FunnelPanel
          funnel={funnel}
          copy={{
            title: a.dashboardFunnelTitle,
            intro: a.dashboardFunnelIntro,
            dropoffs: a.dashboardFunnelDropoffs,
            sources: a.dashboardFunnelSources,
            sourcesHint: a.dashboardFunnelSourcesHint,
            empty: a.dashboardFunnelEmpty,
            sourcesEmpty: a.dashboardFunnelSourcesEmpty,
          }}
        />
      )}
    </div>
  )
}
