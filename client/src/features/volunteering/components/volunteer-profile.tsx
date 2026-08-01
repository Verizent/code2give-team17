import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '@/components/site-provider'
import { SkillChips } from '@/features/volunteering/components/skill-chips'
import type { VolunteerSkill } from '@/features/volunteering/fixtures'
import type { VolunteerProfile } from '@/features/volunteering/profile'
import { saveProfileSkills } from '@/features/volunteering/profile-prefs'
import { cn } from '@/lib/utils'

export function VolunteerProfilePanel({
  profile,
  onSkillsSaved,
}: {
  profile: VolunteerProfile
  onSkillsSaved?: (skills: VolunteerSkill[]) => void
}) {
  const { locale, t } = useSite()
  const m = t.me
  const [draftSkills, setDraftSkills] = useState<VolunteerSkill[]>(profile.skills)
  const [savedFlash, setSavedFlash] = useState(false)
  const earned = profile.badges.filter((b) => b.earned)
  const locked = profile.badges.filter((b) => !b.earned)
  const dirty =
    draftSkills.length !== profile.skills.length ||
    draftSkills.some((s) => !profile.skills.includes(s))

  useEffect(() => {
    setDraftSkills(profile.skills)
  }, [profile.skills])

  function handleSave() {
    if (!profile.email) return
    const prefs = saveProfileSkills(profile.email, draftSkills)
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 2000)
    onSkillsSaved?.(prefs.skills)
  }

  return (
    <div className="mt-10 space-y-14">
      <section>
        <p className="text-sm font-semibold tracking-wide text-teal uppercase">
          {m.volunteerKicker}
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
          {profile.name ?? m.volunteerTitle}
        </h2>
        {profile.email ? (
          <p className="mt-2 text-navy/60">{profile.email}</p>
        ) : null}
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-navy/65">
          {m.volunteerHoursNote}
        </p>

        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-amber px-5 py-6">
            <dt className="text-sm font-semibold text-navy/60">{m.statSessions}</dt>
            <dd className="mt-2 font-display text-4xl font-semibold text-navy">
              {profile.session_count}
            </dd>
          </div>
          <div className="rounded-2xl bg-amber px-5 py-6">
            <dt className="text-sm font-semibold text-navy/60">{m.statHours}</dt>
            <dd className="mt-2 font-display text-4xl font-semibold text-navy">
              {profile.hours_total}
            </dd>
          </div>
          <div className="rounded-2xl bg-amber px-5 py-6">
            <dt className="text-sm font-semibold text-navy/60">{m.statProgrammes}</dt>
            <dd className="mt-2 font-display text-4xl font-semibold text-navy">
              {profile.programme_count}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-paper/60 p-5 sm:p-8">
        <SkillChips
          selected={draftSkills}
          onChange={setDraftSkills}
          title={m.skillsTitle}
          hint={m.skillsHint}
        />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!profile.email || !dirty}
            onClick={handleSave}
            className="inline-flex min-h-12 items-center rounded-md bg-navy px-6 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {m.skillsSave}
          </button>
          {savedFlash ? (
            <p className="text-sm font-semibold text-teal">{m.skillsSaved}</p>
          ) : null}
          {!profile.email ? (
            <p className="text-sm text-navy/55">{m.skillsNeedEmail}</p>
          ) : null}
        </div>
      </section>

      {profile.session_count === 0 ? (
        <section>
          <h3 className="font-display text-2xl font-semibold text-navy">{m.sessionsTitle}</h3>
          <p className="mt-3 max-w-xl text-navy/70">{m.volunteerEmpty}</p>
          <Link
            to="/volunteer"
            className="mt-6 inline-flex min-h-12 items-center rounded-md bg-navy px-6 font-semibold text-white"
          >
            {m.volunteerCta}
          </Link>
        </section>
      ) : (
        <section>
          <h3 className="font-display text-2xl font-semibold text-navy">{m.sessionsTitle}</h3>
          <ul className="mt-6 divide-y divide-navy/10 border-y border-navy/10">
            {profile.sessions.map((session) => (
              <li
                key={session.signup.id}
                className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-navy">{session.title[locale]}</p>
                  <p className="mt-1 text-sm text-navy/60">{session.when[locale]}</p>
                  <p className="mt-1 text-xs font-semibold tracking-wide text-teal uppercase">
                    {m.sessionConfirmed} · {session.hours}h
                  </p>
                </div>
                <Link
                  to={`/volunteer/briefing/${session.signup.id}`}
                  className="inline-flex min-h-11 shrink-0 items-center font-semibold text-navy underline-offset-4 hover:underline"
                >
                  {m.openBriefing} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile.interests.length > 0 ? (
        <section>
          <h3 className="font-display text-2xl font-semibold text-navy">{m.interestsTitle}</h3>
          <p className="mt-2 max-w-xl text-sm text-navy/60">{m.interestsLead}</p>
          <ul className="mt-6 divide-y divide-navy/10 border-y border-navy/10">
            {profile.interests.map((interest) => (
              <li key={interest.id} className="py-5">
                <p className="font-semibold text-navy">{interest.title[locale]}</p>
                <p className="mt-1 text-sm text-navy/60">{interest.when[locale]}</p>
                <p className="mt-1 text-xs font-semibold tracking-wide text-teal uppercase">
                  {m.interestRegistered}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="font-display text-2xl font-semibold text-navy">{m.badgesTitle}</h3>
        <p className="mt-2 max-w-xl text-sm text-navy/60">{m.badgesSubhead}</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {[...earned, ...locked].map((badge) => (
            <li
              key={badge.code}
              className={cn(
                'rounded-2xl border px-5 py-5',
                badge.earned
                  ? 'border-teal/30 bg-teal/5'
                  : 'border-navy/10 bg-white opacity-70',
              )}
            >
              <p className="text-xs font-bold tracking-wide text-teal uppercase">
                {badge.earned ? m.badgeEarned : m.badgeLocked}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-navy">
                {badge.name[locale]}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-navy/65">
                {badge.description[locale]}
              </p>
              {!badge.earned && (
                <p className="mt-3 text-xs font-semibold text-navy/45">
                  {badge.progress}/{badge.threshold}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/volunteer"
          className="inline-flex min-h-12 items-center rounded-md bg-navy px-6 font-semibold text-white"
        >
          {m.volunteerMoreCta}
        </Link>
        <Link
          to="/give"
          className="inline-flex min-h-12 items-center rounded-md border border-navy px-6 font-semibold text-navy"
        >
          {m.giveCta}
        </Link>
      </div>
    </div>
  )
}
