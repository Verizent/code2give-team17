import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandPatternBand, LovePatternBg } from '@/components/brand-pattern'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { useSite } from '@/components/site-provider'
import { SkipLink } from '@/components/skip-link'
import { useAuth } from '@/features/auth/AuthProvider'
import { listOpportunities } from '@/features/volunteering/api'
import { CorporatePanel } from '@/features/volunteering/components/corporate-panel'
import { InterestForm } from '@/features/volunteering/components/interest-form'
import {
  ModeSplitter,
  type VolunteerMode,
} from '@/features/volunteering/components/mode-splitter'
import { OpportunityList } from '@/features/volunteering/components/opportunity-list'
import { SkillChips } from '@/features/volunteering/components/skill-chips'
import type {
  VolunteerOpportunity,
  VolunteerSkill,
} from '@/features/volunteering/fixtures'
import { getProfileSkills } from '@/features/volunteering/profile-prefs'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

function sameSkills(a: VolunteerSkill[], b: VolunteerSkill[]) {
  if (a.length !== b.length) return false
  return a.every((s) => b.includes(s))
}

export function VolunteerPage() {
  const { t } = useSite()
  const v = t.volunteer
  const auth = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<VolunteerMode>('individual')
  const [skills, setSkills] = useState<VolunteerSkill[]>([])
  const [useMySkills, setUseMySkills] = useState(false)
  const [showHubForm, setShowHubForm] = useState(false)
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const mySkills = getProfileSkills(auth.user?.email)
  const loggedIn = Boolean(auth.ready && auth.user)

  useEffect(() => {
    trackEvent('volunteer_view', { page: 'hub' })
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    void listOpportunities(skills)
      .then((items) => {
        if (!cancelled) {
          setOpportunities(items)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOpportunities([])
          setLoadError(true)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [skills])

  function handleToggleMySkills(next: boolean) {
    setUseMySkills(next)
    if (next) setSkills([...mySkills])
    else setSkills([])
  }

  function handleSkillsChange(next: VolunteerSkill[]) {
    setSkills(next)
    if (useMySkills && !sameSkills(next, mySkills)) {
      setUseMySkills(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <LovePatternBg variant="navy">
          <div className="mx-auto max-w-[1120px] px-4 py-14 sm:px-8 sm:py-20">
            <p className="kicker text-yellow">{v.kicker}</p>
            <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.02] font-semibold text-white">
              {v.title}
            </h1>
            <p className="section-lede section-lede-on-dark mt-5 max-w-xl text-base leading-relaxed text-white sm:text-lg">
              {v.subhead}
            </p>
            <Link
              to="/community"
              className="mt-7 inline-flex min-h-11 items-center font-semibold text-yellow underline-offset-4 hover:underline"
            >
              {v.communityLink} →
            </Link>
          </div>
        </LovePatternBg>

        <BrandPatternBand variant="yellow" className="easy-hide" />

        <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-8 sm:py-24">
          <ModeSplitter value={mode} onChange={setMode} />

          <div className="mt-16 border-t border-navy/8 pt-16 sm:mt-24 sm:pt-24">
            {mode === 'individual' ? (
              <div className="space-y-16 sm:space-y-24">
                <div className="space-y-6">
                  {loggedIn ? (
                    <div className="rounded-2xl border border-navy/10 bg-paper/70 px-5 py-4 sm:px-6">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 accent-navy"
                          checked={useMySkills}
                          disabled={mySkills.length === 0}
                          onChange={(e) => handleToggleMySkills(e.target.checked)}
                        />
                        <span>
                          <span
                            className={cn(
                              'block font-semibold',
                              mySkills.length === 0 ? 'text-navy/45' : 'text-navy',
                            )}
                          >
                            {v.filterMySkills}
                          </span>
                          <span className="mt-1 block text-sm text-navy/60">
                            {mySkills.length === 0
                              ? v.filterMySkillsEmpty
                              : v.filterMySkillsHint}
                          </span>
                          {mySkills.length === 0 ? (
                            <Link
                              to="/me"
                              className="mt-2 inline-flex text-sm font-semibold text-teal underline-offset-4 hover:underline"
                            >
                              {v.filterMySkillsEdit} →
                            </Link>
                          ) : null}
                        </span>
                      </label>
                    </div>
                  ) : auth.ready ? (
                    <p className="text-sm text-navy/60">
                      <Link
                        to="/login?redirect=/volunteer"
                        className="font-semibold text-navy underline-offset-4 hover:underline"
                      >
                        {v.filterMySkillsLogin}
                      </Link>
                    </p>
                  ) : null}

                  <SkillChips selected={skills} onChange={handleSkillsChange} />
                </div>

                {loading ? (
                  <p className="text-navy/60">{v.listTitle}…</p>
                ) : (
                  <OpportunityList
                    opportunities={opportunities}
                    loadError={loadError}
                    filtered={skills.length > 0}
                  />
                )}

                <section className="rounded-3xl border border-navy/10 bg-paper p-6 sm:p-10">
                  <h2 className="font-display text-3xl font-semibold text-navy">
                    {loggedIn ? v.hubSignedInTitle : v.hubSignupTitle}
                  </h2>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-navy/70">
                    {loggedIn ? v.hubSignedInSubhead : v.hubSignupSubhead}
                  </p>
                  {loggedIn ? (
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        to="/me"
                        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-navy px-6 font-bold text-white"
                      >
                        {v.hubSignedInCta}
                      </Link>
                    </div>
                  ) : showHubForm ? (
                    <div className="mt-8 max-w-xl rounded-2xl bg-white p-5 sm:p-8">
                      <InterestForm
                        onSuccess={() =>
                          navigate(
                            `/volunteer/success?session=${encodeURIComponent(v.hubSignupTitle)}`,
                          )
                        }
                        onCancel={() => setShowHubForm(false)}
                      />
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setShowHubForm(true)}
                        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-navy px-6 font-bold text-white"
                      >
                        {v.hubSignupCta}
                      </button>
                      <Link
                        to="/login?mode=signup&redirect=/volunteer"
                        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-navy px-6 font-semibold text-navy"
                      >
                        {v.hubCreateAccountCta}
                      </Link>
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <CorporatePanel />
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
