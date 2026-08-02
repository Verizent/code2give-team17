import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { mediaItems } from '@/lib/mock'
import { listArticles } from '@/features/content/api'

/**
 * Love 21's own writing, read on Love 21's own site.
 *
 * This page used to send every visitor straight back to love21foundation.com. Six of
 * the eight items listed there already exist as full articles in our `articles` table,
 * so those now open at /news/:slug instead. The two that remain outbound are a headline
 * and a thumbnail pointing at an RTHK episode and a newspaper column — there is no body
 * to republish, and inventing one would be worse than a link.
 */
export function ArticlesPage() {
  const { locale, t } = useSite()
  const copy = t.articlesPage
  const [articles, setArticles] = useState([])

  useEffect(() => {
    let cancelled = false
    // 50 is the API ceiling; the archive is nowhere near it, so this is the whole list.
    listArticles({ locale, limit: 50 }).then((rows) => {
      if (!cancelled) setArticles(rows)
    })
    return () => {
      cancelled = true
    }
  }, [locale])

  const press = mediaItems.filter((item) => item.externalOnly)

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

          {articles.length > 0 && (
            <section aria-labelledby="our-stories" className="mt-12">
              <h2
                id="our-stories"
                className="font-display text-2xl font-semibold text-navy sm:text-3xl"
              >
                {copy.ourStories}
              </h2>
              <p className="mt-2 max-w-2xl text-navy/70">{copy.ourStoriesLede}</p>

              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <li key={article.id}>
                    <Link
                      to={`/news/${article.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-md border border-navy/10 bg-white transition-colors hover:border-navy/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                    >
                      {article.cover_image_url && (
                        <div className="aspect-[16/10] overflow-hidden bg-navy/10">
                          <img
                            src={article.cover_image_url}
                            // Resolved to the active locale by the API; empty means
                            // decorative, not missing.
                            alt={article.cover_alt ?? ''}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-5">
                        <p className="text-xs font-semibold tracking-wide text-teal uppercase">
                          {t.news.categories[article.category] ?? article.category}
                        </p>
                        <h3 className="mt-2 flex-1 font-display text-lg font-semibold text-navy text-balance">
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p className="mt-2 text-sm leading-relaxed text-navy/70">
                            {article.excerpt}
                          </p>
                        )}
                        <span className="mt-4 text-sm font-bold text-teal">
                          {copy.readArticle}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {press.length > 0 && (
            <section aria-labelledby="in-press" className="mt-14">
              <h2
                id="in-press"
                className="font-display text-2xl font-semibold text-navy sm:text-3xl"
              >
                {copy.inPress}
              </h2>
              <p className="mt-2 max-w-2xl text-navy/70">{copy.inPressLede}</p>

              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {press.map((item) => (
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
                        <h3 className="mt-2 flex-1 font-display text-lg font-semibold text-navy text-balance">
                          {item.title[locale]}
                        </h3>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-teal">
                          {copy.readArticle}
                          <ExternalLink className="size-3.5" aria-hidden />
                        </span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-12 text-sm text-navy/55">
            <Link
              to="/community"
              className="font-semibold text-navy underline-offset-2 hover:underline"
            >
              ← {copy.backToCommunity}
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
