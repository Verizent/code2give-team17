import { FormEvent, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  VOLUNTEER_AGE_GROUPS,
  type VolunteerAgeGroup,
} from '@/features/volunteering/fixtures'
import {
  saveVolunteerPrefs,
  VOLUNTEER_DISCOVERY,
  VOLUNTEER_GENDERS,
  VOLUNTEER_ROLES,
  type VolunteerDiscovery,
  type VolunteerGender,
  type VolunteerRole,
} from '@/features/volunteering/profile-prefs'
import { cn } from '@/lib/utils'

type Mode = 'signin' | 'signup'

export function LoginPage() {
  const { t } = useSite()
  const v = t.volunteer
  const auth = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/me'
  const prefillEmail = params.get('email') || ''

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'signin')
  const [fullName, setFullName] = useState('')
  const [chineseName, setChineseName] = useState('')
  const [ageGroup, setAgeGroup] = useState<VolunteerAgeGroup | ''>('')
  const [gender, setGender] = useState<VolunteerGender | ''>('')
  const [phone, setPhone] = useState('')
  const [roles, setRoles] = useState<VolunteerRole[]>([])
  const [roleOther, setRoleOther] = useState('')
  const [discovery, setDiscovery] = useState<VolunteerDiscovery | ''>('')
  const [discoveryOther, setDiscoveryOther] = useState('')
  const [about, setAbout] = useState('')
  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const safeRedirect = useMemo(() => {
    if (redirect.startsWith('/') && !redirect.startsWith('//')) return redirect
    return '/me'
  }, [redirect])

  if (auth.ready && auth.user) {
    return <Navigate to={safeRedirect} replace />
  }

  function toggleRole(role: VolunteerRole) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    )
  }

  function persistProfile(accountEmail: string) {
    if (!ageGroup || !gender || !discovery || roles.length === 0) return
    saveVolunteerPrefs(accountEmail, {
      full_name: fullName.trim(),
      chinese_name: chineseName.trim(),
      age_group: ageGroup,
      gender,
      phone: phone.trim(),
      roles,
      role_other: roles.includes('other') ? roleOther.trim() : undefined,
      discovery,
      discovery_other: discovery === 'other' ? discoveryOther.trim() : undefined,
      about: about.trim() || undefined,
    })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)

    if (mode === 'signup') {
      if (!ageGroup || !gender || roles.length === 0 || !discovery) {
        setError(t.login.genericError)
        return
      }
      if (roles.includes('other') && !roleOther.trim()) {
        setError(t.login.genericError)
        return
      }
      if (discovery === 'other' && !discoveryOther.trim()) {
        setError(t.login.genericError)
        return
      }
    }

    setBusy(true)
    try {
      if (!auth.configured) {
        setError(t.login.notConfigured)
        return
      }
      if (mode === 'signup') {
        const result = await auth.signUp({ email, password, fullName })
        persistProfile(email.trim().toLowerCase())
        if (result.needsEmailConfirmation) {
          setInfo(t.login.checkEmail)
          setMode('signin')
          return
        }
      } else {
        await auth.signIn(email, password)
      }
      navigate(safeRedirect, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : t.login.genericError
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const field =
    'mt-1.5 min-h-12 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10'

  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <main
        id="main"
        className={cn(
          'mx-auto px-4 py-14 sm:px-6 sm:py-20',
          mode === 'signup' ? 'max-w-lg' : 'max-w-md',
        )}
      >
        <p className="kicker text-teal">{t.login.kicker}</p>
        <h1 className="mt-3 font-display text-[clamp(1.85rem,5vw,2.5rem)] font-semibold text-navy">
          {mode === 'signin' ? t.login.signInTitle : t.login.signUpTitle}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-navy/70">{t.login.subhead}</p>

        <div
          className="mt-8 flex gap-2 rounded-full border border-navy/10 bg-white p-1"
          role="tablist"
          aria-label={t.login.modeLabel}
        >
          {(['signin', 'signup'] as Mode[]).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={mode === option}
              onClick={() => {
                setMode(option)
                setError(null)
                setInfo(null)
              }}
              className={cn(
                'min-h-11 flex-1 rounded-full text-sm font-semibold',
                mode === option ? 'bg-navy text-white' : 'text-navy/70',
              )}
            >
              {option === 'signin' ? t.login.signInTab : t.login.signUpTab}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-4">
          {error && (
            <p role="alert" className="rounded-md bg-red/10 px-3 py-2 text-sm font-medium text-red">
              {error}
            </p>
          )}
          {info && (
            <p role="status" className="rounded-md bg-teal/10 px-3 py-2 text-sm font-medium text-teal">
              {info}
            </p>
          )}

          {mode === 'signup' && (
            <>
              <p className="text-sm leading-relaxed text-navy/65">{t.login.volunteerProfileHint}</p>

              <label className="block text-sm font-semibold text-navy">
                {t.login.chineseName} *
                <input
                  required
                  value={chineseName}
                  onChange={(e) => setChineseName(e.target.value)}
                  className={field}
                />
              </label>

              <label className="block text-sm font-semibold text-navy">
                {t.login.fullName} *
                <input
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={field}
                />
              </label>

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

              <fieldset>
                <legend className="text-sm font-semibold text-navy">{v.interestGender} *</legend>
                <div className="mt-2 flex flex-col gap-2">
                  {VOLUNTEER_GENDERS.map((g) => (
                    <label
                      key={g}
                      className="flex min-h-11 items-center gap-2 text-[14px] text-navy"
                    >
                      <input
                        type="radio"
                        name="gender"
                        required
                        checked={gender === g}
                        onChange={() => setGender(g)}
                        className="accent-navy"
                      />
                      {v.genders[g]}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block text-sm font-semibold text-navy">
                {t.login.phone} *
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={field}
                />
              </label>

              <fieldset>
                <legend className="text-sm font-semibold text-navy">{v.interestRoles} *</legend>
                <div className="mt-2 space-y-2">
                  {VOLUNTEER_ROLES.map((role) => (
                    <label
                      key={role}
                      className="flex min-h-11 items-start gap-2 text-[14px] text-navy"
                    >
                      <input
                        type="checkbox"
                        checked={roles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="mt-1 accent-navy"
                      />
                      <span>{v.roles[role]}</span>
                    </label>
                  ))}
                </div>
                {roles.includes('other') && (
                  <input
                    required
                    value={roleOther}
                    onChange={(e) => setRoleOther(e.target.value)}
                    placeholder={v.interestRoleOther}
                    className={cn(field, 'mt-2')}
                  />
                )}
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold text-navy">
                  {v.interestDiscovery} *
                </legend>
                <div className="mt-2 space-y-2">
                  {VOLUNTEER_DISCOVERY.map((d) => (
                    <label
                      key={d}
                      className="flex min-h-11 items-center gap-2 text-[14px] text-navy"
                    >
                      <input
                        type="radio"
                        name="discovery"
                        required
                        checked={discovery === d}
                        onChange={() => setDiscovery(d)}
                        className="accent-navy"
                      />
                      {v.discovery[d]}
                    </label>
                  ))}
                </div>
                {discovery === 'other' && (
                  <input
                    required
                    value={discoveryOther}
                    onChange={(e) => setDiscoveryOther(e.target.value)}
                    placeholder={v.interestDiscoveryOther}
                    className={cn(field, 'mt-2')}
                  />
                )}
              </fieldset>

              <label className="block text-sm font-semibold text-navy">
                {v.interestAbout}
                <textarea
                  rows={3}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className={field}
                />
              </label>
            </>
          )}

          <label className="block text-sm font-semibold text-navy">
            {t.login.email} *
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </label>

          <label className="block text-sm font-semibold text-navy">
            {t.login.password} *
            <input
              required
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
            />
          </label>

          <button
            type="submit"
            disabled={busy || !auth.ready}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-red px-5 font-bold text-white disabled:opacity-50"
          >
            {busy
              ? t.login.working
              : mode === 'signin'
                ? t.login.signInCta
                : t.login.signUpCta}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-navy/60">
          <Link to="/me" className="font-semibold text-navy underline-offset-4 hover:underline">
            {t.login.backToMe}
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}
