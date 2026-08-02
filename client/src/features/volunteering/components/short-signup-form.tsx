import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '@/components/site-provider'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  confirmEmailVerification,
  hasAnsweredDiscovery,
  startEmailVerification,
  submitSignup,
} from '@/features/volunteering/api'
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

/**
 * Good enough to decide whether to spend a lookup on a half-typed address. Not validation —
 * the browser's own type="email" and the server both police that, and the real authority on
 * deliverability is the verification code arriving.
 */
function isEmailish(value: string) {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value.trim())
}

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

  // Guests prove the address before a seat is taken. A signed-in volunteer signing up
  // their own address skips this — Supabase Auth already proved it, and the server
  // accepts that; asking them to read a code out of their inbox again would be theatre.
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [code, setCode] = useState('')

  // Multi-select on purpose: people arrive through more than one route ("a friend shared
  // their Instagram post"), and a single answer throws away the overlap between channels.
  const [discovery, setDiscovery] = useState<string[]>([])
  const [discoveryOther, setDiscoveryOther] = useState('')
  const [discoveryAnswered, setDiscoveryAnswered] = useState(false)

  function toggleDiscovery(key: string) {
    setDiscovery((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    )
  }

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

  const lookupEmail = (loggedIn ? accountEmail : email).trim().toLowerCase()

  /**
   * Returning volunteers are not asked again how they found Love 21 — it is recorded once
   * per person, and the server ignores a second answer anyway, so asking would be a
   * question whose answer goes nowhere.
   *
   * Debounced because it runs off a field being typed into, and only fired once the value
   * looks like an address so we are not probing on every keystroke.
   */
  useEffect(() => {
    if (!isEmailish(lookupEmail)) {
      setDiscoveryAnswered(false)
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      void hasAnsweredDiscovery(lookupEmail).then((answered) => {
        if (!cancelled) setDiscoveryAnswered(answered)
      })
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [lookupEmail])

  const fullName = loggedIn ? accountName || name : name
  const submitEmail = loggedIn ? accountEmail : email

  /** Guests only: ask for a code, then swap the form for the code step. */
  async function requestCode() {
    setBusy(true)
    setError(null)
    try {
      const started = await startEmailVerification(submitEmail)
      if (!started.ok) {
        setError(
          started.reason === 'rate_limited'
            ? v.verifyRateLimited
            : started.reason === 'undeliverable'
              ? v.verifySendError
              : v.signupError,
        )
        return
      }
      setVerificationId(started.id)
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (full) {
      setError(v.fullError)
      return
    }
    if (!ageGroup || !ack) return
    if (!fullName.trim() || !submitEmail.trim()) return

    // Step one for a guest: nothing is claimed yet, so no seat is held while they go and
    // read their email.
    if (!loggedIn && !verificationId) {
      await requestCode()
      return
    }

    setBusy(true)
    setError(null)
    try {
      let verification_token: string | undefined
      if (!loggedIn) {
        const confirmed = await confirmEmailVerification(verificationId as string, code)
        if (!confirmed.ok) {
          setError(v.verifyBadCode)
          return
        }
        verification_token = confirmed.token
      }

      const result = await submitSignup({
        opportunity_id: opportunityId,
        full_name: fullName,
        email: submitEmail,
        phone: phone || undefined,
        age_group: ageGroup,
        emergency_name: loggedIn ? undefined : emergencyName || undefined,
        emergency_phone: loggedIn ? undefined : emergencyPhone || undefined,
        verification_token,
        // Nothing sent when they were never asked. The server would ignore it, but sending
        // an answer the volunteer did not give this time is a lie in the request either way.
        discovery_sources: !discoveryAnswered && discovery.length > 0 ? discovery : undefined,
        discovery_other:
          !discoveryAnswered && discovery.includes('other')
            ? discoveryOther || undefined
            : undefined,
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

  const step = !loggedIn && verificationId ? 'verify' : 'details'

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

      {step === 'verify' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-navy">{v.verifyTitle}</p>
          <p className="text-[14px] leading-relaxed text-navy/70">
            {v.verifyBody.replace('{email}', submitEmail)}
          </p>
          <label className="block text-sm font-semibold text-navy">
            {v.verifyCodeLabel} *
            <input
              required
              // Not type="number": that strips leading zeros, and a code may start with one.
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={fieldClass}
            />
          </label>
          <button
            type="button"
            onClick={() => void requestCode()}
            disabled={busy}
            className="text-sm font-semibold text-teal underline-offset-4 hover:underline disabled:opacity-50"
          >
            {v.verifyResend}
          </button>
        </div>
      )}

      {!loggedIn && step === 'details' ? (
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

      <fieldset className={cn(step === 'verify' && 'hidden')}>
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

      {!loggedIn && step === 'details' ? (
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

      <fieldset
        className={cn((step === 'verify' || discoveryAnswered) && 'hidden')}
      >
        <legend className="text-sm font-semibold text-navy">{v.discoveryTitle}</legend>
        <p className="mt-1 text-xs text-navy/55">{v.discoveryHint}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(v.discoverySources).map(([key, label]) => {
            const active = discovery.includes(key)
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => toggleDiscovery(key)}
                className={cn(
                  'min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors',
                  active
                    ? 'border-navy bg-navy text-white'
                    : 'border-navy/15 bg-white text-navy hover:border-navy/50',
                )}
              >
                {label as string}
              </button>
            )
          })}
        </div>
        {discovery.includes('other') && (
          <label className="mt-3 block text-sm font-semibold text-navy">
            {v.discoveryOther}
            <input
              value={discoveryOther}
              onChange={(e) => setDiscoveryOther(e.target.value)}
              maxLength={200}
              className={fieldClass}
            />
          </label>
        )}
      </fieldset>

      <label
        className={cn(
          'flex cursor-pointer gap-3 text-sm leading-relaxed text-navy/80',
          step === 'verify' && 'hidden',
        )}
      >
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
          disabled={full || busy || (step === 'verify' && code.length !== 6)}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-red px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step === 'verify' ? v.verifyConfirm : v.shortSubmit}
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
