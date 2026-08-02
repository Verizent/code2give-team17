import { useEffect, useState } from 'react'
import { fetchOpportunitySignups, type OpportunitySignup } from '@/features/admin/api'
import { useSite } from '@/components/site-provider'

/**
 * The volunteers signed up to one session. Mounted only while its row is expanded, so the
 * fetch happens on first open rather than for all fifty rows on page load. The parent keeps
 * this mounted (hidden) once opened, so re-opening costs nothing.
 */
export function SessionRoster({ opportunityId }: { opportunityId: string }) {
  const { t } = useSite()
  const a = t.admin
  const [rows, setRows] = useState<OpportunitySignup[] | null>(null)
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
  )
}

function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-HK', { day: 'numeric', month: 'short', year: 'numeric' })
}
