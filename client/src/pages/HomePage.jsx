import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { Hero } from '@/components/home/hero'
import { StatsBand } from '@/components/home/stats-band'
import { AchievementsBand } from '@/components/home/achievements-band'
import { AbilitySpotlight } from '@/components/home/ability-spotlight'
import { ThreePaths } from '@/components/home/three-paths'

export function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <Hero />
        <StatsBand />
        <AchievementsBand />
        <AbilitySpotlight />
        <ThreePaths />
      </main>
      <SiteFooter />
    </div>
  )
}
