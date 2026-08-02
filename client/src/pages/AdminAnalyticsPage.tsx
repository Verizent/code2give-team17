import { useEffect, useState } from 'react'
import { fetchAdminAnalytics, type AnalyticsPayload } from '@/features/admin/api'
import { useSite } from '@/components/site-provider'

/** Programme keys are DB enums; the admin surface is staff-facing English. */
const PROGRAMME_LABELS: Record<string, string> = {
  family: 'Family support',
  fitness: 'Fitness',
  nutrition: 'Nutrition',
  sports: 'Sports',
  where_needed: 'Where needed',
  community_education: 'Community education',
}

const SOURCE_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  friend: 'Friend or family',
  search: 'Search engine',
  school: 'School or university',
  handson: 'HandsOn Hong Kong',
  unknown: 'Not answered',
}

function label(map: Record<string, string>, key: string) {
  return map[key] ?? key
}

/**
 * A rate tile. `null` renders as "not enough data" rather than 0% — the two mean very
 * different things and only one of them is a claim about the charity.
 */
function RateTile({
  title,
  hint,
  value,
  detail,
  emptyLabel,
}: {
  title: string
  hint: string
  value: number | null
  detail: string
  emptyLabel: string
}) {
  const hasValue = value !== null

  return (
    <div className="rounded-lg border border-navy/10 bg-white/60 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-navy/45">{title}</p>
      {hasValue ? (
        <p className="mt-2 font-display text-3xl font-semibold text-navy">{value}%</p>
      ) : (
        <p className="mt-2 font-display text-lg font-semibold text-navy/40">{emptyLabel}</p>
      )}
      <p className="mt-2 text-sm leading-relaxed text-navy/65">{hasValue ? detail : hint}</p>
    </div>
  )
}

/** Grouped horizontal bars: places offered vs people who came. */
function ProgrammeBars({
  rows,
  capacityLabel,
  attendedLabel,
}: {
  rows: AnalyticsPayload['programmes']
  capacityLabel: string
  attendedLabel: string
}) {
  const max = Math.max(...rows.map((r) => r.capacity), 1)

  return (
    <ul className="mt-5 flex flex-col gap-5">
      {rows.map((row) => (
        <li key={row.programme}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-navy">
              {label(PROGRAMME_LABELS, row.programme)}
            </span>
            <span className="text-sm text-navy/60">
              {row.attendance_count} / {row.capacity}
              {row.fill_rate !== null && (
                <span className="ml-2 font-semibold text-teal">{row.fill_rate}%</span>
              )}
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-[11px] text-navy/45">{capacityLabel}</span>
              <div
                className="h-3 rounded-sm bg-navy/15"
                style={{ width: `${Math.max(2, (row.capacity / max) * 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-[11px] text-navy/45">{attendedLabel}</span>
              <div
                className="h-3 rounded-sm bg-teal"
                style={{ width: `${Math.max(2, (row.attendance_count / max) * 100)}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function SourceList({
  title,
  rows,
}: {
  title: string
  rows: Array<{ source: string; count: number }>
}) {
  const total = rows.reduce((sum, r) => sum + r.count, 0)

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-navy/45">{title}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.source} className="flex items-center gap-3">
            <span className="w-36 shrink-0 text-sm text-navy/75">
              {label(SOURCE_LABELS, row.source)}
            </span>
            <div
              className="h-2.5 rounded-sm bg-amber"
              style={{ width: `${Math.max(3, (row.count / Math.max(total, 1)) * 100)}%` }}
            />
            <span className="text-sm font-semibold text-navy/70">{row.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AdminAnalyticsPage() {
  const { t } = useSite()
  const a = t.admin
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchAdminAnalytics()
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">
          {a.analyticsTitle}
        </h1>
        <p className="mt-6 rounded-md bg-red/10 px-4 py-3 text-red">{a.analyticsLoadError}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">
          {a.analyticsTitle}
        </h1>
        <p className="mt-6 text-navy/70">…</p>
      </div>
    )
  }

  const { donor_retention, repeat_gift, capacity_fill, satisfaction, programmes, acquisition } = data

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">
        {a.analyticsTitle}
      </h1>
      <p className="mt-2 max-w-2xl text-navy/70">{a.analyticsIntro}</p>

      {/* DEMO-ONLY: the figures below come from a seed, not real supporter activity.
          Love 21 staff sit on the judging panel — this banner is not optional. */}
      <p className="mt-6 rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-navy/80">
        {a.analyticsIllustrative}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RateTile
          title={a.analyticsDonorRetention}
          hint={a.analyticsDonorRetentionHint}
          value={donor_retention.rate}
          detail={`${donor_retention.retained} of ${donor_retention.prior_donors} gave again`}
          emptyLabel={a.analyticsNoData}
        />
        <RateTile
          title={a.analyticsRepeatGift}
          hint={a.analyticsRepeatGiftHint}
          value={repeat_gift.rate}
          detail={`${repeat_gift.repeat_donors} of ${repeat_gift.total_donors} donors`}
          emptyLabel={a.analyticsNoData}
        />
        <RateTile
          title={a.analyticsCapacityFill}
          hint={a.analyticsCapacityFillHint}
          value={capacity_fill.rate}
          detail={`${capacity_fill.attended} of ${capacity_fill.capacity} places`}
          emptyLabel={a.analyticsNoData}
        />
        <div className="rounded-lg border border-navy/10 bg-white/60 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-navy/45">
            {a.analyticsSatisfaction}
          </p>
          {satisfaction.average_rating !== null ? (
            <>
              <p className="mt-2 font-display text-3xl font-semibold text-navy">
                {satisfaction.average_rating}
                <span className="ml-1 text-lg font-normal text-navy/45">/ 5</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-navy/65">
                {satisfaction.would_return_rate !== null && (
                  <>
                    {satisfaction.would_return_rate}% {a.analyticsWouldReturn} ·{' '}
                  </>
                )}
                {satisfaction.responses} {a.analyticsResponses}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 font-display text-lg font-semibold text-navy/40">
                {a.analyticsNoData}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-navy/65">
                {a.analyticsSatisfactionHint}
              </p>
            </>
          )}
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-navy">{a.analyticsProgrammes}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-navy/65">
          {a.analyticsProgrammesIntro}
        </p>
        {programmes.length === 0 ? (
          <p className="mt-6 text-sm text-navy/55">{a.analyticsNoData}</p>
        ) : (
          <ProgrammeBars
            rows={programmes}
            capacityLabel={a.analyticsCapacityLabel}
            attendedLabel={a.analyticsAttendedLabel}
          />
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-navy">{a.analyticsSource}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-navy/65">
          {a.analyticsSourceIntro}
        </p>
        {!acquisition.available && (
          <p className="mt-3 text-sm text-navy/50">{a.analyticsSourcePending}</p>
        )}
        <div className="mt-5 grid gap-8 sm:grid-cols-2">
          <SourceList title={a.analyticsSourceDonors} rows={acquisition.donors} />
          <SourceList title={a.analyticsSourceVolunteers} rows={acquisition.volunteers} />
        </div>
      </section>
    </div>
  )
}
