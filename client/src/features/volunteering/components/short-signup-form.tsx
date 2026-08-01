import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '@/components/site-provider'
import { useAuth } from '@/features/auth/AuthProvider'
import { submitSignup } from '@/features/volunteering/api'
import {
  VOLUNTEER_AGE_GROUPS,
  type VolunteerAgeGroup,
} from '@/features/volunteering/fixtures'
import {
  getVolunteerPrefs,
  saveVolunteerPrefs,
} from '@/features/volunteering/profile-prefs'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

/** Short auto-confirm signup — no staff gate. Logged-in users skip name/email/phone/emergency. */
export function ShortSignupForm({
  opportunityId,
  onSuccess,
  onCancel,
  full,
}: {
  opportunityId: string
  onSuccess: (signupId: string) => void
  onCancel?: () => void
  full?: boolean
}) {
  const { t } = useSite()
  const v = t.volunteer
  const auth = useAuth()
  const loggedIn = Boolean(auth.ready && auth.user?.email)

  const accountEmail = auth.user?.email?.trim().toLowerCase() ?? ''
  const accountName =
    (auth.user?.user_metadata?.full_name as string | undefined)?.trim() ||
    getVolunteerPrefs(accountEmail).full_name ||
    (accountEmail ? accountEmail.split('@')[0] : '') ||
    ''

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [ageGroup, setAgeGroup] = useState<VolunteerAgeGroup | ''>('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [ack, setAck] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!auth.ready) return
    if (auth.user?.email) {
      const mail = auth.user.email.trim().toLowerCase()
      const nextPrefs = getVolunteerPrefs(mail)
      const displayName =
        (auth.user.user_metadata?.full_name as string | undefined)?.trim() ||
        nextPrefs.full_name ||
        mail.split('@')[0] ||
        ''
      setName(displayName)
      setEmail(mail)
      setPhone(nextPrefs.phone ?? '')
      setAgeGroup(nextPrefs.age_group ?? '')
      return
    }
    setAgeGroup('')
  }, [auth.ready, auth.user])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (full) {
      setError(v.fullError)
      return
    }
    if (!ageGroup || !ack) return

    const fullName = loggedIn ? accountName || name : name
    const submitEmail = loggedIn ? accountEmail : email
    if (!fullName.trim() || !submitEmail.trim()) return

    setBusy(true)
    setError(null)
    try {
      const result = await submitSignup({
        opportunity_id: opportunityId,
        full_name: fullName,
        email: submitEmail,
        phone: phone || undefined,
        age_group: ageGroup,
        emergency_name: loggedIn ? undefined : emergencyName || undefined,
        emergency_phone: loggedIn ? undefined : emergencyPhone || undefined,
      })

      if (!result.ok) {
        setError(
          result.reason === 'full'
            ? v.fullError
            : result.reason === 'duplicate'
              ? v.signupDuplicate
              : v.signupError,
        )
        return
      }

      if (loggedIn && accountEmail) {
        saveVolunteerPrefs(accountEmail, {
          full_name: fullName,
          phone: phone || undefined,
          age_group: ageGroup,
        })
      }

      trackEvent('interest_submit', {
        opportunityId,
        signupId: result.signupId,
        email: submitEmail.trim().toLowerCase(),
      })
      onSuccess(result.signupId)
    } finally {
      setBusy(false)
    }
  }

  const fieldClass =
    'mt-1.5 min-h-12 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10'

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <p className="text-[14px] leading-relaxed text-navy/70">
        {loggedIn ? v.shortFormIntroLoggedIn : v.shortFormIntro}
      </p>

      {loggedIn ? (
        <div className="rounded-xl border border-navy/10 bg-paper/80 px-4 py-3">
          <p className="text-sm font-semibold text-navy">
            {v.joiningAs
              .replace('{name}', accountName || accountEmail)
              .replace('{email}', accountEmail)}
          </p>
          <Link
            to="/me"
            className="mt-1 inline-flex text-xs font-semibold text-teal underline-offset-4 hover:underline"
          >
            {v.joiningAsEdit}
          </Link>
        </div>
      ) : null}

      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-3 py-2 text-sm font-medium text-red">
          {error}
        </p>
      )}

      {!loggedIn ? (
        <>
          <label className="block text-sm font-semibold text-navy">
            {v.shortName} *
            <input
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-semibold text-navy">
            {v.interestEmail} *
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-semibold text-navy">
            {v.interestPhone}
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={fieldClass}
            />
          </label>
        </>
      ) : null}

      <fieldset>
        <legend className="text-sm font-semibold text-navy">{v.interestAgeGroup} *</legend>
        <p className="mt-1 text-xs text-navy/55">{v.ageGroupHint}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {VOLUNTEER_AGE_GROUPS.map((age) => (
            <button
              key={age}
              type="button"
              onClick={() => setAgeGroup(age)}
              className={cn(
                'min-h-11 rounded-full border px-4 text-sm font-semibold',
                ageGroup === age
                  ? 'border-navy bg-navy text-white'
                  : 'border-navy/15 text-navy',
              )}
            >
              {v.ageGroups[age]}
            </button>
          ))}
        </div>
      </fieldset>

      {!loggedIn ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-navy">
            {v.emergencyName}
            <input
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-semibold text-navy">
            {v.emergencyPhone}
            <input
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
      ) : null}

      <label className="flex cursor-pointer gap-3 text-sm leading-relaxed text-navy/80">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          className="mt-1 h-5 w-5 accent-red"
          required
        />
        <span>{v.safeguardAck}</span>
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={full || busy}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-red px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {v.shortSubmit}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-navy px-5 font-semibold text-navy"
          >
            {v.interestCancel}
          </button>
        )}
      </div>
    </form>
  )
}
