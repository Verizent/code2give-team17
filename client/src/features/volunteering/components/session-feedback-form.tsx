import { useId, useState, type FormEvent } from 'react'
import { useSite } from '@/components/site-provider'
import {
  submitSignupFeedback,
  type SignupFeedbackInput,
} from '@/features/volunteering/api'
import type { VolunteerSignup } from '@/features/volunteering/signup-store'
import { cn } from '@/lib/utils'

type FeedbackResult = {
  feedback_submitted_at: string | null
  experience_rating: number | null
  would_return: boolean | null
  improvement_note: string | null
}

export function SessionFeedbackForm({
  signup,
  highlighted,
  onSubmitted,
}: {
  signup: VolunteerSignup
  highlighted?: boolean
  onSubmitted?: (result: FeedbackResult) => void
}) {
  const { t } = useSite()
  const m = t.me
  const ratingId = useId()
  const noteId = useId()

  const alreadySubmitted = Boolean(signup.feedback_submitted_at)
  const [rating, setRating] = useState<number | null>(signup.experience_rating ?? null)
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(
    signup.would_return ?? null,
  )
  const [note, setNote] = useState(signup.improvement_note ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)
  const [done, setDone] = useState(alreadySubmitted)

  if (done) {
    return (
      <p className="mt-3 text-sm font-semibold text-teal">{m.feedbackThanks}</p>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const body: SignupFeedbackInput = {}
    if (rating != null) body.experience_rating = rating
    if (wouldReturn != null) body.would_return = wouldReturn
    const trimmed = note.trim()
    if (trimmed) body.improvement_note = trimmed

    if (Object.keys(body).length === 0) {
      setError(true)
      return
    }

    setSubmitting(true)
    setError(false)
    const result = await submitSignupFeedback(signup.id, body)
    setSubmitting(false)

    if (!result.ok) {
      setError(true)
      return
    }

    setDone(true)
    onSubmitted?.({
      feedback_submitted_at: result.feedback_submitted_at,
      experience_rating: result.experience_rating,
      would_return: result.would_return,
      improvement_note: result.improvement_note,
    })
  }

  return (
    <form
      id={`feedback-${signup.id}`}
      onSubmit={handleSubmit}
      className={cn(
        'mt-4 space-y-4 rounded-2xl border border-navy/10 bg-paper/70 p-4 sm:p-5',
        highlighted && 'ring-2 ring-teal/50',
      )}
    >
      <div>
        <p className="text-sm font-semibold text-navy">{m.feedbackTitle}</p>
        <p className="mt-1 text-sm text-navy/60">{m.feedbackLead}</p>
      </div>

      <fieldset>
        <legend id={ratingId} className="text-sm font-semibold text-navy">
          {m.feedbackRating}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby={ratingId}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-pressed={rating === value}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold',
                rating === value
                  ? 'border-navy bg-navy text-white'
                  : 'border-navy/15 bg-white text-navy hover:border-navy/40',
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-navy">{m.feedbackWouldReturn}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={wouldReturn === true}
            onClick={() => setWouldReturn(true)}
            className={cn(
              'inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-semibold',
              wouldReturn === true
                ? 'border-navy bg-navy text-white'
                : 'border-navy/15 bg-white text-navy hover:border-navy/40',
            )}
          >
            {m.feedbackWouldReturnYes}
          </button>
          <button
            type="button"
            aria-pressed={wouldReturn === false}
            onClick={() => setWouldReturn(false)}
            className={cn(
              'inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-semibold',
              wouldReturn === false
                ? 'border-navy bg-navy text-white'
                : 'border-navy/15 bg-white text-navy hover:border-navy/40',
            )}
          >
            {m.feedbackWouldReturnNo}
          </button>
        </div>
      </fieldset>

      <div>
        <label htmlFor={noteId} className="text-sm font-semibold text-navy">
          {m.feedbackNote}
        </label>
        <textarea
          id={noteId}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={m.feedbackNotePlaceholder}
          className="mt-2 w-full rounded-md border border-navy/15 bg-white px-3 py-2 text-sm text-navy placeholder:text-navy/40"
        />
      </div>

      {error ? <p className="text-sm font-semibold text-red">{m.feedbackError}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 items-center rounded-md bg-navy px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? m.feedbackSubmitting : m.feedbackSubmit}
        </button>
      </div>
    </form>
  )
}
