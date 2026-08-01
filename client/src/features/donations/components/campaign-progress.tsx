import { useState } from 'react'
import { useSite } from '@/components/site-provider'

export function CampaignProgress({
  raised,
  goal,
}: {
  raised: number
  goal: number
}) {
  const { t } = useSite()
  const g = t.give
  const [copied, setCopied] = useState(false)
  const percent = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="font-display text-xl font-semibold text-navy">
          {g.campaignProgress
            .replace('{raised}', raised.toLocaleString())
            .replace('{goal}', goal.toLocaleString())}
        </p>
        <span className="font-semibold text-teal">{percent}%</span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-navy/10">
        <div className="h-full rounded-full bg-teal" style={{ width: `${percent}%` }} />
      </div>
      <button
        type="button"
        onClick={copyLink}
        className="mt-5 min-h-11 rounded-md border border-navy px-5 text-sm font-semibold text-navy"
      >
        {copied ? g.campaignShareDone : g.campaignShare}
      </button>
    </div>
  )
}
