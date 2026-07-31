'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { ShareMomentButton } from '@/components/community/share-moment'
import { FollowProgramPanel } from '@/components/community/follow-program'
import { StoryFeed } from '@/components/community/story-feed'

export default function CommunityPage() {
  const { t } = useSite()

  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 pt-14 pb-8 sm:px-6 sm:pt-20">
            <p className="kicker text-teal">{t.community.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[0.98] font-bold text-navy sm:text-7xl">
              {t.community.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/90 sm:text-xl">
              {t.community.subhead}
            </p>
            <div className="mt-8">
              <ShareMomentButton />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <FollowProgramPanel />
          <StoryFeed />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
