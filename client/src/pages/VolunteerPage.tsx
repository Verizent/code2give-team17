import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandPatternBand, LovePatternBg } from '@/components/brand-pattern'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { useSite } from '@/components/site-provider'
import { SkipLink } from '@/components/skip-link'
import { listOpportunities } from '@/features/volunteering/api'
import { CorporatePanel } from '@/features/volunteering/components/corporate-panel'
import { InterestForm } from '@/features/volunteering/components/interest-form'
import {
  ModeSplitter,
  type VolunteerMode,
} from '@/features/volunteering/components/mode-splitter'
import { OpportunityList } from '@/features/volunteering/components/opportunity-list'
import { SkillChips } from '@/features/volunteering/components/skill-chips'
import type { VolunteerSkill } from '@/features/volunteering/fixtures'
import { trackEvent } from '@/lib/analytics'

export function VolunteerPage() {
  const { t } = useSite()
  const v = t.volunteer
  const navigate = useNavigate()
  const [mode, setMode] = useState<VolunteerMode>('individual')
  const [skills, setSkills] = useState<VolunteerSkill[]>([])
  const [showHubForm, setShowHubForm] = useState(false)

  useEffect(() => {
    trackEvent('volunteer_view', { page: 'hub' })
  }, [])

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
            <p className="section-lede mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
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
                <SkillChips selected={skills} onChange={setSkills} />
                <OpportunityList opportunities={listOpportunities(skills)} />

                <section className="rounded-3xl border border-navy/10 bg-paper p-6 sm:p-10">
                  <h2 className="font-display text-3xl font-semibold text-navy">
                    {v.hubSignupTitle}
                  </h2>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-navy/70">
                    {v.hubSignupSubhead}
                  </p>
                  {showHubForm ? (
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
                    <button
                      type="button"
                      onClick={() => setShowHubForm(true)}
                      className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-navy px-6 font-bold text-white"
                    >
                      {v.hubSignupCta}
                    </button>
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
