import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '@/components/site-provider'
import { useAuth } from '@/features/auth/AuthProvider'
import { submitInterest } from '@/features/volunteering/api'
import {
  VOLUNTEER_AGE_GROUPS,
  type VolunteerAgeGroup,
} from '@/features/volunteering/fixtures'
import {
  getVolunteerPrefs,
  saveVolunteerPrefs,
  VOLUNTEER_DISCOVERY,
  VOLUNTEER_GENDERS,
  VOLUNTEER_ROLES,
  type VolunteerDiscovery,
  type VolunteerGender,
  type VolunteerRole,
} from '@/features/volunteering/profile-prefs'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

/** Guest form for programme interest; logged-in users reuse saved profile details. */
export function InterestForm({
  opportunityId,
  onSuccess,
  onCancel,
}: {
  opportunityId?: string
  onSuccess: () => void
  onCancel?: () => void
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

  const [chineseName, setChineseName] = useState('')
  const [englishName, setEnglishName] = useState('')
  const [ageGroup, setAgeGroup] = useState<VolunteerAgeGroup | ''>('')
  const [gender, setGender] = useState<VolunteerGender | ''>('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [roles, setRoles] = useState<VolunteerRole[]>([])
  const [roleOther, setRoleOther] = useState('')
  const [about, setAbout] = useState('')
  const [discovery, setDiscovery] = useState<VolunteerDiscovery | ''>('')
  const [discoveryOther, setDiscoveryOther] = useState('')
  const [ack, setAck] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<'duplicate' | 'error' | null>(null)

  useEffect(() => {
    if (!auth.ready) return
    if (!auth.user?.email) return
    const mail = auth.user.email.trim().toLowerCase()
    const prefs = getVolunteerPrefs(mail)
    const displayName =
      (auth.user.user_metadata?.full_name as string | undefined)?.trim() ||
      prefs.full_name ||
      mail.split('@')[0] ||
      ''
    setEnglishName(displayName)
    setChineseName(prefs.chinese_name ?? '')
    setEmail(mail)
    setPhone(prefs.phone ?? '')
    setAgeGroup(prefs.age_group ?? '')
    setGender(prefs.gender ?? '')
    setRoles(prefs.roles ?? [])
    setRoleOther(prefs.role_other ?? '')
    setAbout(prefs.about ?? '')
    setDiscovery(prefs.discovery ?? '')
    setDiscoveryOther(prefs.discovery_other ?? '')
  }, [auth.ready, auth.user])

  function toggleRole(role: VolunteerRole) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const prefs = loggedIn ? getVolunteerPrefs(accountEmail) : null
    const fullName = loggedIn ? accountName || englishName : englishName
    const submitEmail = loggedIn ? accountEmail : email.trim().toLowerCase()
    const submitPhone = (loggedIn ? prefs?.phone || phone : phone).trim()
    const submitChinese = (loggedIn ? prefs?.chinese_name || chineseName : chineseName).trim()
    const submitAge = (loggedIn ? prefs?.age_group || ageGroup : ageGroup) as
      | VolunteerAgeGroup
      | ''
    const submitGender = (loggedIn ? prefs?.gender || gender : gender) as
      | VolunteerGender
      | ''
    const submitRoles =
      loggedIn && (prefs?.roles?.length ?? 0) > 0 ? (prefs?.roles as VolunteerRole[]) : roles
    const submitRoleOther = loggedIn ? prefs?.role_other || roleOther : roleOther
    const submitAbout = loggedIn ? prefs?.about || about : about
    const submitDiscovery = (loggedIn ? prefs?.discovery || discovery : discovery) as
      | VolunteerDiscovery
      | ''
    const submitDiscoveryOther = loggedIn
      ? prefs?.discovery_other || discoveryOther
      : discoveryOther

    if (!submitAge || !submitGender || submitRoles.length === 0 || !submitDiscovery) return
    if (submitRoles.includes('other') && !String(submitRoleOther).trim()) return
    if (submitDiscovery === 'other' && !String(submitDiscoveryOther).trim()) return
    if (!fullName.trim() || !submitEmail.trim()) return
    if (!loggedIn && !submitPhone) return
    if (!ack) return

    trackEvent('interest_submit', {
      opportunityId,
      email: submitEmail,
      loggedIn,
    })

    const messageParts = [
      String(submitAbout).trim(),
      `Roles: ${submitRoles.join(', ')}${String(submitRoleOther).trim() ? ` (${String(submitRoleOther).trim()})` : ''}`,
      `Age: ${submitAge}`,
      `Gender: ${submitGender}`,
      `Discovery: ${submitDiscovery}${String(submitDiscoveryOther).trim() ? ` (${String(submitDiscoveryOther).trim()})` : ''}`,
      submitChinese ? `Chinese name: ${submitChinese}` : '',
    ].filter(Boolean)

    setSubmitting(true)
    setError(null)
    const result = await submitInterest({
      opportunity_id: opportunityId,
      full_name: fullName.trim(),
      email: submitEmail,
      phone: submitPhone || undefined,
      message: messageParts.join('\n'),
    })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.reason)
      return
    }

    if (loggedIn && accountEmail) {
      saveVolunteerPrefs(accountEmail, {
        full_name: fullName.trim(),
        chinese_name: submitChinese || undefined,
        phone: submitPhone || undefined,
        age_group: submitAge,
        gender: submitGender,
        roles: submitRoles,
        role_other: submitRoles.includes('other')
          ? String(submitRoleOther).trim()
          : undefined,
        about: String(submitAbout).trim() || undefined,
        discovery: submitDiscovery,
        discovery_other:
          submitDiscovery === 'other' ? String(submitDiscoveryOther).trim() : undefined,
      })
    }

    onSuccess()
  }

  const fieldClass =
    'mt-1.5 min-h-12 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10'

  const needAge = !loggedIn || !ageGroup
  const needGender = !loggedIn || !gender
  const needPhone = !loggedIn || !phone.trim()
  const needRoles = !loggedIn || roles.length === 0
  const needDiscovery = !loggedIn || !discovery

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <p className="text-[14px] leading-relaxed text-navy/70">
        {loggedIn ? v.interestFormIntroLoggedIn : v.formIntro}
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

      {!loggedIn ? (
        <>
          <label className="block text-sm font-semibold text-navy">
            {v.interestChineseName} *
            <input
              required
              value={chineseName}
              onChange={(e) => setChineseName(e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-semibold text-navy">
            {v.interestEnglishName} *
            <input
              required
              autoComplete="name"
              value={englishName}
              onChange={(e) => setEnglishName(e.target.value)}
              className={fieldClass}
            />
          </label>
        </>
      ) : null}

      {needAge ? (
        <fieldset>
          <legend className="text-sm font-semibold text-navy">{v.interestAgeGroup} *</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {VOLUNTEER_AGE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setAgeGroup(group)}
                className={cn(
                  'min-h-11 rounded-full border px-4 text-sm font-semibold',
                  ageGroup === group
                    ? 'border-navy bg-navy text-white'
                    : 'border-navy/20 text-navy hover:border-navy/40',
                )}
              >
                {v.ageGroups[group]}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {needGender ? (
        <fieldset>
          <legend className="text-sm font-semibold text-navy">{v.interestGender} *</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {VOLUNTEER_GENDERS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={cn(
                  'min-h-11 rounded-full border px-4 text-sm font-semibold',
                  gender === g
                    ? 'border-navy bg-navy text-white'
                    : 'border-navy/20 text-navy hover:border-navy/40',
                )}
              >
                {v.genders[g]}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {!loggedIn ? (
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
      ) : null}

      {needPhone ? (
        <label className="block text-sm font-semibold text-navy">
          {v.interestPhone} *
          <input
            required
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass}
          />
        </label>
      ) : null}

      {needRoles ? (
        <fieldset>
          <legend className="text-sm font-semibold text-navy">{v.interestRoles} *</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {VOLUNTEER_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={cn(
                  'min-h-11 rounded-full border px-4 text-sm font-semibold',
                  roles.includes(role)
                    ? 'border-navy bg-navy text-white'
                    : 'border-navy/20 text-navy hover:border-navy/40',
                )}
              >
                {v.roles[role]}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {roles.includes('other') && (needRoles || !loggedIn) ? (
        <label className="block text-sm font-semibold text-navy">
          {v.interestRoleOther} *
          <input
            required
            value={roleOther}
            onChange={(e) => setRoleOther(e.target.value)}
            className={fieldClass}
          />
        </label>
      ) : null}

      {!loggedIn ? (
        <label className="block text-sm font-semibold text-navy">
          {v.interestAbout}
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={4}
            className={fieldClass}
          />
        </label>
      ) : null}

      {needDiscovery ? (
        <fieldset>
          <legend className="text-sm font-semibold text-navy">{v.interestDiscovery} *</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {VOLUNTEER_DISCOVERY.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDiscovery(d)}
                className={cn(
                  'min-h-11 rounded-full border px-4 text-sm font-semibold',
                  discovery === d
                    ? 'border-navy bg-navy text-white'
                    : 'border-navy/20 text-navy hover:border-navy/40',
                )}
              >
                {v.discovery[d]}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {discovery === 'other' && (needDiscovery || !loggedIn) ? (
        <label className="block text-sm font-semibold text-navy">
          {v.interestDiscoveryOther} *
          <input
            required
            value={discoveryOther}
            onChange={(e) => setDiscoveryOther(e.target.value)}
            className={fieldClass}
          />
        </label>
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

      {error ? (
        <p role="alert" className="rounded-xl bg-amber px-4 py-3 text-sm text-navy">
          {error === 'duplicate' ? v.interestDuplicate : v.interestError}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-red px-6 font-bold text-white hover:bg-red/90 disabled:opacity-50"
        >
          {submitting ? '…' : loggedIn ? v.registerInterest : v.interestSubmit}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-navy px-6 font-semibold text-navy"
          >
            {v.interestCancel}
          </button>
        )}
      </div>
    </form>
  )
}
