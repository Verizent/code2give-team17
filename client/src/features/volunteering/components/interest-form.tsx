import { useState, type FormEvent } from 'react'
import { useSite } from '@/components/site-provider'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

type AgeGroup = 'age14_15' | 'age16_17' | 'age18'
type Gender = 'female' | 'male' | 'prefer_not'
type Role = 'assistant' | 'host' | 'event' | 'other'
type Discovery = 'existing' | 'social' | 'edm' | 'company' | 'other'

const AGES: AgeGroup[] = ['age14_15', 'age16_17', 'age18']
const GENDERS: Gender[] = ['female', 'male', 'prefer_not']
const ROLES: Role[] = ['assistant', 'host', 'event', 'other']
const DISCOVERY: Discovery[] = ['existing', 'social', 'edm', 'company', 'other']

/** Mirrors love21foundation.com/our-volunteer/ — DEMO-ONLY submit. */
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
  const [chineseName, setChineseName] = useState('')
  const [englishName, setEnglishName] = useState('')
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [roles, setRoles] = useState<Role[]>([])
  const [roleOther, setRoleOther] = useState('')
  const [about, setAbout] = useState('')
  const [discovery, setDiscovery] = useState<Discovery | ''>('')
  const [discoveryOther, setDiscoveryOther] = useState('')

  function toggleRole(role: Role) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    )
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ageGroup || !gender || roles.length === 0 || !discovery) return
    if (roles.includes('other') && !roleOther.trim()) return
    if (discovery === 'other' && !discoveryOther.trim()) return

    const payload = {
      opportunityId,
      chineseName,
      englishName,
      ageGroup,
      gender,
      email: email.trim().toLowerCase(),
      phone,
      roles,
      roleOther: roles.includes('other') ? roleOther : undefined,
      about,
      discovery,
      discoveryOther: discovery === 'other' ? discoveryOther : undefined,
    }
    // DEMO-ONLY — POST /volunteer/signups or staff email later
    trackEvent('interest_submit', payload)
    console.log('[DEMO-ONLY] volunteer signup', payload)
    onSuccess()
  }

  const fieldClass =
    'mt-1.5 min-h-12 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10'

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-[14px] leading-relaxed text-navy/70">{v.formIntro}</p>

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

      <fieldset>
        <legend className="text-sm font-semibold text-navy">{v.interestAgeGroup} *</legend>
        <div className="mt-2 flex flex-col gap-2">
          {AGES.map((age) => (
            <label key={age} className="flex min-h-11 items-center gap-2 text-[14px] text-navy">
              <input
                type="radio"
                name="age"
                required
                checked={ageGroup === age}
                onChange={() => setAgeGroup(age)}
                className="accent-navy"
              />
              {v.ageGroups[age]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-navy">{v.interestGender} *</legend>
        <div className="mt-2 flex flex-col gap-2">
          {GENDERS.map((g) => (
            <label key={g} className="flex min-h-11 items-center gap-2 text-[14px] text-navy">
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

      <fieldset>
        <legend className="text-sm font-semibold text-navy">{v.interestRoles} *</legend>
        <div className="mt-2 space-y-2">
          {ROLES.map((role) => (
            <label key={role} className="flex min-h-11 items-start gap-2 text-[14px] text-navy">
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
            className={cn(fieldClass, 'mt-2')}
          />
        )}
      </fieldset>

      <label className="block text-sm font-semibold text-navy">
        {v.interestAbout}
        <textarea
          rows={3}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          className={fieldClass}
        />
      </label>

      <fieldset>
        <legend className="text-sm font-semibold text-navy">{v.interestDiscovery} *</legend>
        <div className="mt-2 space-y-2">
          {DISCOVERY.map((d) => (
            <label key={d} className="flex min-h-11 items-center gap-2 text-[14px] text-navy">
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
            className={cn(fieldClass, 'mt-2')}
          />
        )}
      </fieldset>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        <button
          type="submit"
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-red px-6 font-bold text-white hover:bg-red/90"
        >
          {v.interestSubmit}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-navy px-6 font-semibold text-navy"
          >
            {v.interestCancel}
          </button>
        )}
      </div>
    </form>
  )
}
