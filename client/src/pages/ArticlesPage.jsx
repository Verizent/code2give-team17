import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { mediaItems } from '@/lib/mock'

export function ArticlesPage() {
  const { locale, t } = useSite()
  const copy = t.articlesPage

  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <div className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8 sm:py-16">
          <p className="kicker text-teal">{copy.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-display text-[clamp(2rem,6vw,3.25rem)] font-semibold text-navy">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy/75 sm:text-lg">
            {copy.subhead}
          </p>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mediaItems.map((item) => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full flex-col overflow-hidden rounded-md border border-navy/10 bg-white transition-colors hover:border-navy/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-navy/10">
                    <img
                      src={item.image}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-semibold tracking-wide text-navy/50 uppercase">
                      {item.date[locale]}
                    </p>
                    <h2 className="mt-2 flex-1 font-display text-lg font-semibold text-navy text-balance">
                      {item.title[locale]}
                    </h2>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-teal">
                      {copy.readArticle}
                      <ExternalLink className="size-3.5" aria-hidden />
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-sm text-navy/55">
            <Link to="/community" className="font-semibold text-navy underline-offset-2 hover:underline">
              ← {copy.backToCommunity}
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
