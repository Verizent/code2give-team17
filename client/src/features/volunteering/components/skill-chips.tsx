import { useSite } from '@/components/site-provider'
import {
  VOLUNTEER_SKILLS,
  type VolunteerSkill,
} from '@/features/volunteering/fixtures'
import { cn } from '@/lib/utils'

export function SkillChips({
  selected,
  onChange,
  title,
  hint,
  hideClear,
}: {
  selected: VolunteerSkill[]
  onChange: (skills: VolunteerSkill[]) => void
  title?: string
  hint?: string
  hideClear?: boolean
}) {
  const { t } = useSite()
  const v = t.volunteer
  const heading = title ?? v.skillsTitle
  const subhead = hint ?? v.skillsHint

  function toggle(skill: VolunteerSkill) {
    onChange(
      selected.includes(skill)
        ? selected.filter((item) => item !== skill)
        : [...selected, skill],
    )
  }

  return (
    <section aria-labelledby="volunteer-skills-title">
      <h2
        id="volunteer-skills-title"
        className="font-display text-3xl font-semibold text-navy"
      >
        {heading}
      </h2>
      <p className="mt-2 text-sm text-navy/60">{subhead}</p>
      <div className="mt-5 flex flex-wrap gap-2" aria-label={heading}>
        {VOLUNTEER_SKILLS.map((skill) => {
          const active = selected.includes(skill)
          return (
            <button
              key={skill}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(skill)}
              className={cn(
                'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors',
                active
                  ? 'border-navy bg-navy text-white'
                  : 'border-navy/15 bg-white text-navy hover:border-navy/50',
              )}
            >
              {v.skills[skill]}
            </button>
          )
        })}
      </div>
      {!hideClear && selected.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mt-3 min-h-11 text-sm font-semibold text-teal underline-offset-4 hover:underline"
        >
          {v.clearSkills}
        </button>
      )}
    </section>
  )
}
