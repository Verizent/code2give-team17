import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSite } from '@/components/site-provider'
import { coverOptions, saveCampaign } from '@/features/donations/api'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

export function CampaignForm() {
  const navigate = useNavigate()
  const { t } = useSite()
  const g = t.give
  const covers = coverOptions()
  const [cover, setCover] = useState(covers[0])
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setWorking(true)
    const data = new FormData(event.currentTarget)
    try {
      const campaign = await saveCampaign({
        title: String(data.get('title')),
        story: String(data.get('story')),
        goal_hkd: Number(data.get('goal_hkd')),
        end_date: String(data.get('end_date')),
        cover,
      })
      trackEvent('campaign_create', { slug: campaign.slug, goal: campaign.goal_hkd })
      navigate(`/c/${campaign.slug}`)
    } catch {
      setError(g.formError)
    } finally {
      setWorking(false)
    }
  }

  const field =
    'mt-2 min-h-12 w-full rounded-md border border-navy/20 bg-white px-4 text-navy outline-none focus:border-navy'

  return (
    <form onSubmit={submit} className="space-y-6 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
      <label className="block text-sm font-semibold text-navy">
        {g.formTitle}
        <input name="title" required minLength={4} className={field} />
      </label>
      <label className="block text-sm font-semibold text-navy">
        {g.formStory}
        <textarea name="story" required minLength={20} rows={6} className={cn(field, 'py-3')} />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-navy">
          {g.formGoal}
          <input name="goal_hkd" type="number" min="500" step="100" required className={field} />
        </label>
        <label className="block text-sm font-semibold text-navy">
          {g.formEnd}
          <input
            name="end_date"
            type="date"
            required
            min={new Date().toISOString().slice(0, 10)}
            className={field}
          />
        </label>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold text-navy">{g.formCover}</legend>
        <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3">
          {covers.map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => setCover(option)}
              aria-pressed={cover === option}
              className={cn(
                'overflow-hidden rounded-xl border-4',
                cover === option ? 'border-yellow' : 'border-transparent',
              )}
            >
              <img src={option} alt="" className="aspect-[4/3] w-full object-cover" />
            </button>
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-3 py-2 text-sm font-medium text-red">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={working}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-red px-6 font-semibold text-white disabled:opacity-60 sm:w-auto"
      >
        {working ? g.formWorking : g.formSubmit}
      </button>
    </form>
  )
}
