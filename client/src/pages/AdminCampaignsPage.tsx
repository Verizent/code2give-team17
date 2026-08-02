import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listPendingCampaigns,
  moderateCampaign,
  type Campaign,
} from '@/features/donations/api'
import { useSite } from '@/components/site-provider'
import { ApiError } from '@/lib/apiClient'

export function AdminCampaignsPage() {
  const { t } = useSite()
  const a = t.admin
  const [pending, setPending] = useState<Campaign[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      setPending(await listPendingCampaigns())
      setError(null)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? 'Could not load pending campaigns.'
          : 'Could not load pending campaigns.',
      )
      setPending([])
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function decide(id: string, status: 'approved' | 'rejected') {
    setBusyId(id)
    setError(null)
    try {
      await moderateCampaign(id, status)
      await refresh()
    } catch {
      setError('Could not update campaign status.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">{a.campaignsTitle}</h1>
      <p className="mt-2 max-w-2xl text-navy/70">{a.campaignsIntro}</p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red/10 px-3 py-2 text-sm text-red">
          {error}
        </p>
      )}

      {pending.length === 0 ? (
        <p className="mt-8 text-navy/70">No campaigns waiting for approval.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {pending.map((campaign) => (
            <li
              key={campaign.id}
              className="flex flex-col gap-4 border-b border-navy/10 pb-5 sm:flex-row sm:items-center"
            >
              <img
                src={campaign.cover}
                alt=""
                className="h-24 w-32 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-semibold text-navy">{campaign.title}</p>
                <p className="mt-1 text-sm text-navy/60">
                  Goal HK${campaign.goal_hkd.toLocaleString()} · ends {campaign.end_date}
                </p>
                <Link
                  to={`/c/${campaign.slug}`}
                  className="mt-2 inline-flex text-sm font-semibold text-teal underline-offset-4 hover:underline"
                >
                  Preview page
                </Link>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={busyId === campaign.id}
                  onClick={() => void decide(campaign.id, 'approved')}
                  className="min-h-11 rounded-md bg-teal px-4 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === campaign.id}
                  onClick={() => void decide(campaign.id, 'rejected')}
                  className="min-h-11 rounded-md border border-navy/20 px-4 text-sm font-semibold text-navy disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
