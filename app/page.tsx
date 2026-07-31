import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { Hero } from '@/components/home/hero'
import { StatsBand } from '@/components/home/stats-band'
import { ActivityRow } from '@/components/home/activity-row'
import { AbilitySpotlight } from '@/components/home/ability-spotlight'
import { ThreePaths } from '@/components/home/three-paths'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <Hero />
        <StatsBand />
        <ActivityRow />
        <AbilitySpotlight />
        <ThreePaths />
      </main>
      <SiteFooter />
    </div>
  )
}
