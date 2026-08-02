import { useEffect, useState } from 'react'
import {
  fetchAdminDashboard,
  fetchAdminFunnel,
  fetchAdminAnalytics,
  type AnalyticsPayload,
  type DashboardPayload,
  type FunnelPayload,
} from '@/features/admin/api'
import { useSite } from '@/components/site-provider'
import { BarChart } from '@/features/admin/components/bar-chart'
import { FunnelPanel } from '@/features/admin/components/funnel-panel'
import { MetricTiles } from '@/features/admin/components/metric-tiles'
import { ProgrammeBars } from '@/features/admin/components/programme-bars'
import { RateTile } from '@/features/admin/components/rate-tile'
import { SourceList } from '@/features/admin/components/source-list'
import { WorkQueue } from '@/features/admin/components/work-queue'

function formatHkd(n: number) {
  if (n >= 10_000) return `HK$${(n / 1000).toFixed(0)}k`
  if (n >= 1000) return `HK$${(n / 1000).toFixed(1)}k`
  return `HK$${n.toLocaleString()}`
}

/**
 * The staff hub: work queue, real counts, then illustrative analytics.
 *
 * Three fetches rather than one combined endpoint, deliberately. They fail
 * independently, so a dead analytics endpoint costs the analytics section and leaves the
 * queue — the only actionable block — standing.
 */
export function AdminDashboardPage() {
  const { t } = useSite()
  const a = t.admin
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null)
  const [funnel, setFunnel] = useState<FunnelPayload | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null)
  const [dashboardFailed, setDashboardFailed] = useState(false)
  const [analyticsFailed, setAnalyticsFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    void fetchAdminDashboard()
      .then((data) => !cancelled && setDashboard(data))
      .catch(() => !cancelled && setDashboardFailed(true))
    void fetchAdminFunnel()
      .then((data) => !cancelled && setFunnel(data))
      .catch(() => {
        /* Supplementary — its absence should not raise an error on the page. */
      })
    void fetchAdminAnalytics()
      .then((data) => !cancelled && setAnalytics(data))
      .catch(() => !cancelled && setAnalyticsFailed(true))

    return () => {
      cancelled = true
    }
  }, [])

  const metrics = dashboard?.metrics
  const tiles = metrics
    ? [
        {
          label: a.dashboardTileDonations,
          // Exact, not abbreviated: this is a real figure staff may quote. The chart
          // below uses formatHkd because axis labels have no room for full precision.
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
    : []

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">
        {a.dashboardTitle}
      </h1>
      <p className="mt-2 max-w-2xl text-navy/70">{a.dashboardIntro}</p>

      {/* 1 — Today. First because it is the only block anyone can act on. */}
      <section aria-labelledby="hub-today" className="mt-10">
        <h2 id="hub-today" className="font-display text-2xl font-semibold text-navy">
          {a.hubToday}
        </h2>
        <p className="mt-1 text-sm text-navy/65">{a.hubTodayIntro}</p>
        {dashboardFailed ? (
          <p className="mt-4 rounded-md bg-red/10 px-4 py-3 text-sm text-red">
            {a.hubSectionError}
          </p>
        ) : (
          <WorkQueue
            items={dashboard?.queue ?? []}
            openLabel={a.dashboardQueueOpen}
            emptyLabel={dashboard ? a.hubQueueEmpty : '…'}
          />
        )}
      </section>

      {/* 2 — Real counts, straight from the database. */}
      <section aria-labelledby="hub-live" className="mt-14 border-t border-navy/10 pt-10">
        <h2 id="hub-live" className="font-display text-2xl font-semibold text-navy">
          {a.hubLive}
        </h2>
        <p className="mt-1 text-sm text-navy/65">{a.hubLiveIntro}</p>
        {dashboardFailed ? (
          <p className="mt-4 rounded-md bg-red/10 px-4 py-3 text-sm text-red">
            {a.hubSectionError}
          </p>
        ) : (
          <MetricTiles tiles={tiles} />
        )}
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
      </section>

      {/*
        3 — Illustrative. The provenance is structural, not a banner: the heading itself
        says the figures are generated, and a heavy amber rule separates it from the real
        counts above. A notice at the top of the page is invisible once scrolled past,
        and this page mixes real and fabricated numbers. Love 21 staff judge this.
      */}
      <section aria-labelledby="hub-illustrative" className="mt-16 border-t-4 border-amber/50 pt-10">
        <h2 id="hub-illustrative" className="font-display text-2xl font-semibold text-navy">
          {a.hubIllustrative}
        </h2>
        <p className="mt-2 max-w-2xl rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-navy/80">
          {a.hubIllustrativeIntro}
        </p>

        {analyticsFailed || !analytics ? (
          <p className="mt-6 text-sm text-navy/55">{analyticsFailed ? a.hubSectionError : '…'}</p>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <RateTile
                title={a.analyticsDonorRetention}
                hint={a.analyticsDonorRetentionHint}
                value={analytics.donor_retention.rate}
                detail={`${analytics.donor_retention.retained} of ${analytics.donor_retention.prior_donors} gave again`}
                emptyLabel={a.analyticsNoData}
              />
              <RateTile
                title={a.analyticsRepeatGift}
                hint={a.analyticsRepeatGiftHint}
                value={analytics.repeat_gift.rate}
                detail={`${analytics.repeat_gift.repeat_donors} of ${analytics.repeat_gift.total_donors} donors`}
                emptyLabel={a.analyticsNoData}
              />
              <RateTile
                title={a.analyticsCapacityFill}
                hint={a.analyticsCapacityFillHint}
                value={analytics.capacity_fill.rate}
                detail={`${analytics.capacity_fill.attended} of ${analytics.capacity_fill.capacity} places`}
                emptyLabel={a.analyticsNoData}
              />
              <RateTile
                title={a.analyticsSatisfaction}
                hint={a.analyticsSatisfactionHint}
                value={analytics.satisfaction.average_rating}
                unit="/ 5"
                detail={`${analytics.satisfaction.would_return_rate}% ${a.analyticsWouldReturn} · ${analytics.satisfaction.responses} ${a.analyticsResponses}`}
                emptyLabel={a.analyticsNoData}
              />
            </div>

            <div className="mt-12 max-w-2xl">
              <BarChart
                label={a.hubChartMoney}
                description={a.hubChartMoneyDesc}
                unitLabel={a.hubChartMoneyUnit}
                emptyLabel={a.analyticsNoData}
                totalSuffix={a.hubChartTotal}
                values={analytics.donations_by_month}
                valueKey="amount_hkd"
                formatValue={formatHkd}
              />
            </div>

            <div className="mt-12">
              <h3 className="font-display text-xl font-semibold text-navy">
                {a.analyticsProgrammes}
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-navy/65">
                {a.analyticsProgrammesIntro}
              </p>
              <ProgrammeBars
                rows={analytics.programmes}
                capacityLabel={a.analyticsCapacityLabel}
                attendedLabel={a.analyticsAttendedLabel}
              />
            </div>

            <div className="mt-12">
              <h3 className="font-display text-xl font-semibold text-navy">{a.analyticsSource}</h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-navy/65">
                {a.analyticsSourceIntro}
              </p>
              {!analytics.acquisition.available && (
                <p className="mt-3 text-sm text-navy/50">{a.analyticsSourcePending}</p>
              )}
              <div className="mt-5 grid gap-8 sm:grid-cols-2">
                <SourceList title={a.analyticsSourceDonors} rows={analytics.acquisition.donors} />
                <SourceList
                  title={a.analyticsSourceVolunteers}
                  rows={analytics.acquisition.volunteers}
                />
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
