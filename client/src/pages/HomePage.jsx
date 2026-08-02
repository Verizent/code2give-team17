import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { Hero } from '@/components/home/hero'
import { StatsBand } from '@/components/home/stats-band'
import { AchievementsBand } from '@/components/home/achievements-band'
import { ThreePaths } from '@/components/home/three-paths'
import { NewsStrip } from '@/components/home/news-strip'
import {
  AnnualReportBar,
  CommunityMilestones,
  HomeSectionNav,
  LeadershipBand,
  PartnerCsrBand,
  ProgrammesBand,
  StoryTimeline,
} from '@/components/home/home-sections'

export function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <Hero />
        <HomeSectionNav />
        <div id="impact" className="scroll-mt-28">
          <StatsBand />
          <AnnualReportBar />
        </div>
        <div id="stories" className="scroll-mt-28">
          <CommunityMilestones />
          <AchievementsBand />
          <PartnerCsrBand />
          <StoryTimeline />
        </div>
        {/* Outside the #stories wrapper: it carries its own #news anchor for the
            section nav, and nesting it would put two anchors in one scroll target. */}
        <NewsStrip />
        <ProgrammesBand />
        <LeadershipBand />
        <ThreePaths />
      </main>
      <SiteFooter />
    </div>
  )
}
