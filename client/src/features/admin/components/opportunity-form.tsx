import { useState } from 'react'
import {
  createOpportunity,
  type AdminOpportunity,
  type OpportunityCreatePayload,
} from '@/features/admin/api'
import { OPPORTUNITY_PROGRAMMES, PROGRAMME_LABELS, label } from './labels'
import { useSite } from '@/components/site-provider'
import { ApiError } from '@/lib/apiClient'

const EMPTY = {
  title_en: '',
  title_zh: '',
  location_en: '',
  location_zh: '',
  description_en: '',
  description_zh: '',
  programme: 'sports',
  capacity: '8',
  starts_at: '',
  ends_at: '',
  min_age: '',
  skills: '',
}

/**
 * Create a volunteer opportunity. Both languages are required for title, location and
 * description because `createOpportunityBodySchema` is a strict object that requires them —
 * and because a half-translated listing renders as English to Chinese visitors.
 *
 * Validation here mirrors that schema so a mistake shows up beside the field rather than as
 * a 400 after the round trip. The server still validates; this is not the gate.
 */
export function OpportunityForm({
  onCreated,
  onCancel,
}: {
  onCreated: (opportunity: AdminOpportunity) => void
  onCancel: () => void
}) {
  const { t } = useSite()
  const a = t.admin
  const [values, setValues] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function set(field: keyof typeof EMPTY, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()

    const payload = validate(values, a)
    if (typeof payload === 'string') {
      setError(payload)
      return
    }

    setBusy(true)
    setError(null)
    try {
      const { opportunity } = await createOpportunity(payload)
      onCreated(opportunity)
    } catch (err) {
      // The server's message is more specific than anything we can guess at — a rejected
      // field, a failed session insert — so show it when there is one.
      setError(err instanceof ApiError ? err.message : a.volunteersCreateError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 rounded-lg border border-navy/15 bg-white/60 p-4 sm:p-6"
    >
      <h2 className="font-display text-xl font-semibold text-navy">{a.volunteersNewTitle}</h2>
      <p className="mt-1 text-sm text-navy/65">{a.volunteersNewIntro}</p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red/10 px-3 py-2 text-sm text-red">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label={a.volunteersFieldTitleEn}>
          <input
            className={INPUT}
            value={values.title_en}
            onChange={(e) => set('title_en', e.target.value)}
          />
        </Field>
        <Field label={a.volunteersFieldTitleZh}>
          <input
            className={INPUT}
            value={values.title_zh}
            onChange={(e) => set('title_zh', e.target.value)}
          />
        </Field>
        <Field label={a.volunteersFieldLocationEn}>
          <input
            className={INPUT}
            value={values.location_en}
            onChange={(e) => set('location_en', e.target.value)}
          />
        </Field>
        <Field label={a.volunteersFieldLocationZh}>
          <input
            className={INPUT}
            value={values.location_zh}
            onChange={(e) => set('location_zh', e.target.value)}
          />
        </Field>
        <Field label={a.volunteersFieldDescriptionEn}>
          <textarea
            rows={4}
            className={INPUT}
            value={values.description_en}
            onChange={(e) => set('description_en', e.target.value)}
          />
        </Field>
        <Field label={a.volunteersFieldDescriptionZh}>
          <textarea
            rows={4}
            className={INPUT}
            value={values.description_zh}
            onChange={(e) => set('description_zh', e.target.value)}
          />
        </Field>
        <Field label={a.volunteersFieldProgramme}>
          <select
            className={INPUT}
            value={values.programme}
            onChange={(e) => set('programme', e.target.value)}
          >
            {OPPORTUNITY_PROGRAMMES.map((key) => (
              <option key={key} value={key}>
                {label(PROGRAMME_LABELS, key)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={a.volunteersFieldCapacity}>
          <input
            type="number"
            min={1}
            max={1000}
            className={INPUT}
            value={values.capacity}
            onChange={(e) => set('capacity', e.target.value)}
          />
        </Field>
        <Field label={a.volunteersFieldStarts}>
          <input
            type="datetime-local"
            className={INPUT}
            value={values.starts_at}
            onChange={(e) => set('starts_at', e.target.value)}
          />
        </Field>
        <Field label={a.volunteersFieldEnds}>
          <input
            type="datetime-local"
            className={INPUT}
            value={values.ends_at}
            onChange={(e) => set('ends_at', e.target.value)}
          />
        </Field>
        <Field label={a.volunteersFieldMinAge}>
          <input
            type="number"
            min={0}
            max={120}
            className={INPUT}
            value={values.min_age}
            onChange={(e) => set('min_age', e.target.value)}
          />
        </Field>
        <Field label={a.volunteersFieldSkills}>
          <input
            className={INPUT}
            value={values.skills}
            onChange={(e) => set('skills', e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 rounded-md bg-teal px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? a.volunteersSubmitting : a.volunteersSubmit}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-md border border-navy/20 px-5 text-sm font-semibold text-navy"
        >
          {a.volunteersCancel}
        </button>
      </div>
    </form>
  )
}

const INPUT =
  'mt-1 w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-sm text-navy'

function Field({ label: text, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-navy/75">
      {text}
      {children}
    </label>
  )
}

/**
 * @returns the POST body, or the message to show when the form is not ready to send.
 */
function validate(
  values: typeof EMPTY,
  a: Record<string, string>,
): OpportunityCreatePayload | string {
  const required = [
    'title_en',
    'title_zh',
    'location_en',
    'location_zh',
    'description_en',
    'description_zh',
  ] as const
  if (required.some((field) => values[field].trim() === '')) return a.volunteersErrRequired

  const capacity = Number(values.capacity)
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) {
    return a.volunteersErrCapacity
  }

  if (values.starts_at === '' || values.ends_at === '') return a.volunteersErrDates
  const starts = new Date(values.starts_at)
  const ends = new Date(values.ends_at)
  if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
    return a.volunteersErrDates
  }
  if (ends <= starts) return a.volunteersErrOrder

  const payload: OpportunityCreatePayload = {
    title_en: values.title_en.trim(),
    title_zh: values.title_zh.trim(),
    location_en: values.location_en.trim(),
    location_zh: values.location_zh.trim(),
    description_en: values.description_en.trim(),
    description_zh: values.description_zh.trim(),
    programme: values.programme,
    capacity,
    // `datetime-local` yields a bare local string with no zone, which the server's
    // `z.string().datetime({ offset: true })` rejects. `toISOString` resolves it against the
    // browser's zone and adds the Z — the same instant the admin picked.
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
  }

  if (values.min_age.trim() !== '') {
    const minAge = Number(values.min_age)
    if (!Number.isInteger(minAge) || minAge < 0 || minAge > 120) return a.volunteersErrMinAge
    payload.min_age = minAge
  }

  const skills = values.skills
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean)
  if (skills.length > 0) payload.skills = skills

  return payload
}
