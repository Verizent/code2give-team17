import { useEffect, useState } from 'react'
import {
  fetchOpportunityFeedback,
  fetchOpportunitySignups,
  type OpportunityFeedback,
  type OpportunitySignup,
} from '@/features/admin/api'
import { useSite } from '@/components/site-provider'

/**
 * The volunteers signed up to one session, with the feedback they left. Mounted only while
 * its row is expanded, so the fetches happen on first open rather than for all fifty rows on
 * page load. The parent keeps this mounted (hidden) once opened, so re-opening costs nothing.
 */
export function SessionRoster({ opportunityId }: { opportunityId: string }) {
  const { t } = useSite()
  const a = t.admin
  const [rows, setRows] = useState<OpportunitySignup[] | null>(null)
  const [feedback, setFeedback] = useState<OpportunityFeedback | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchOpportunitySignups(opportunityId)
      .then((items) => {
        if (!cancelled) setRows(items)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    // Separate request, and a failure here is not shown. The roster is the point of opening
    // the row; losing the summary strip should not blank out the names underneath it.
    void fetchOpportunityFeedback(opportunityId)
      .then((summary) => {
        if (!cancelled) setFeedback(summary)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [opportunityId])

  if (error) {
    return (
      <p role="alert" className="px-4 py-3 text-sm text-red">
        {a.volunteersRosterError}
      </p>
    )
  }

  if (rows === null) {
    return <p className="px-4 py-3 text-sm text-navy/60">{a.volunteersRosterLoading}</p>
  }

  if (rows.length === 0) {
    return <p className="px-4 py-3 text-sm text-navy/60">{a.volunteersRosterEmpty}</p>
  }

  return (
    <>
      {feedback && <FeedbackStrip summary={feedback} />}
      <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="text-navy/55">
            <th scope="col" className="px-4 py-2 font-semibold">{a.volunteersColName}</th>
            <th scope="col" className="px-4 py-2 font-semibold">{a.volunteersColEmail}</th>
            <th scope="col" className="px-4 py-2 font-semibold">{a.volunteersColStatus}</th>
            <th scope="col" className="px-4 py-2 font-semibold">{a.volunteersColSignedUp}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-navy/10">
              <td className="px-4 py-2 text-navy">
                {row.volunteer?.full_name || (
                  <span className="text-navy/45">{a.volunteersNoName}</span>
                )}
              </td>
              <td className="px-4 py-2 text-navy/75">{row.volunteer?.email ?? '—'}</td>
              <td className="px-4 py-2 text-navy/75">{row.status}</td>
              <td className="px-4 py-2 text-navy/60">{formatDate(row.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  )
}

/**
 * Attendance and feedback for the session above the roster. Rating and would-return are
 * computed server-side from attended signups only, and come back `null` when nobody has
 * answered — printed as a dash rather than 0, which would read as "everyone rated it zero".
 */
function FeedbackStrip({ summary }: { summary: OpportunityFeedback }) {
  const { t } = useSite()
  const a = t.admin

  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3 border-b border-navy/10 px-4 py-3 text-sm">
      <Stat label={a.volunteersStatAttended} value={String(summary.attended_count)} />
      <Stat label={a.volunteersStatNoShow} value={String(summary.no_show_count)} />
      <Stat
        label={a.volunteersStatRating}
        value={summary.average_rating === null ? '—' : `${summary.average_rating} / 5`}
      />
      <Stat
        label={a.volunteersStatReturn}
        value={
          summary.would_return_percent === null ? '—' : `${summary.would_return_percent}%`
        }
      />
      <Stat
        label={a.volunteersStatResponses}
        value={`${summary.feedback_submitted_count} / ${summary.attended_count}`}
      />
    </dl>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-navy/55">{label}</dt>
      <dd className="mt-0.5 font-semibold text-navy">{value}</dd>
    </div>
  )
}

function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-HK', { day: 'numeric', month: 'short', year: 'numeric' })
}
