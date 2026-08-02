import { LovePatternBg } from '@/components/brand-pattern'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { ShareMomentButton } from '@/components/community/share-moment'
import { ArticlesCta } from '@/components/community/articles-cta'
import { StoryFeed } from '@/components/community/story-feed'
import { StayClose } from '@/components/community/stay-close'

export function CommunityPage() {
  const { t } = useSite()

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <LovePatternBg variant="teal">
          <div className="mx-auto max-w-[1120px] px-4 py-14 sm:px-8 sm:py-20">
            <p className="kicker text-yellow">{t.community.eyebrow}</p>
            <h1 className="mt-3 max-w-3xl font-display text-[clamp(2rem,7vw,3.75rem)] leading-[1.1] font-semibold text-white">
              {t.community.title}
            </h1>
            <p className="section-lede mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:mt-5 sm:text-xl">
              {t.community.subhead}
            </p>
            <div className="mt-6 sm:mt-8">
              <ShareMomentButton />
            </div>
          </div>
        </LovePatternBg>

        <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-8 sm:py-16">
          <StoryFeed />
        </div>

        <ArticlesCta />
        <StayClose />
      </main>
      <SiteFooter />
    </div>
  )
}
