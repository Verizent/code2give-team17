import { useSite } from '@/components/site-provider'
import {
  VOLUNTEER_SKILLS,
  type VolunteerSkill,
} from '@/features/volunteering/fixtures'
import { cn } from '@/lib/utils'

export function SkillChips({
  selected,
  onChange,
}: {
  selected: VolunteerSkill[]
  onChange: (skills: VolunteerSkill[]) => void
}) {
  const { t } = useSite()
  const v = t.volunteer

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
        {v.skillsTitle}
      </h2>
      <p className="mt-2 text-sm text-navy/60">{v.skillsHint}</p>
      <p className="mt-2 text-xs font-bold tracking-wide text-teal uppercase">
        {v.demoMatch}
      </p>
      <div className="mt-5 flex flex-wrap gap-2" aria-label={v.skillsTitle}>
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
      {selected.length > 0 && (
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
