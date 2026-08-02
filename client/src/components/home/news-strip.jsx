import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '@/components/site-provider'
import { listArticles } from '@/features/content/api'

/**
 * Home "Latest from Love 21" strip — the three most recently published articles.
 *
 * Deliberately not filtered to `is_featured`: only one article carries that flag, so
 * the strip would render a single lonely card. Newest-first gives a full row and still
 * leads with the annual report.
 *
 * Renders nothing at all when the API returns no articles, rather than showing an
 * empty section heading on the Home page.
 */
export function NewsStrip() {
  const { locale, t } = useSite()
  const [articles, setArticles] = useState([])

  useEffect(() => {
    let cancelled = false
    listArticles({ locale, limit: 3 }).then((rows) => {
      if (!cancelled) setArticles(rows)
    })
    return () => {
      cancelled = true
    }
  }, [locale])

  if (articles.length === 0) return null

  return (
    <section id="news" className="scroll-mt-28 bg-white px-5 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-[1120px]">
        <p className="kicker text-navy/60">{t.news.eyebrow}</p>
        <h2 className="mt-3 max-w-3xl font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold text-navy">
          {t.news.title}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy/80 sm:text-lg">
          {t.news.subhead}
        </p>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id}>
              {/* `relative` anchors the title link's ::after, which makes the whole
                  card clickable without nesting interactive elements. */}
              <article className="relative h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                {article.cover_image_url && (
                  <img
                    src={article.cover_image_url}
                    // cover_alt is resolved to the active locale by the API. It can be
                    // empty, which is a decorative image, not a missing one.
                    alt={article.cover_alt ?? ''}
                    className="aspect-[16/9] w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="flex flex-col gap-2 p-5">
                  <p className="text-xs font-semibold tracking-wide text-teal uppercase">
                    {t.news.categories[article.category] ?? article.category}
                  </p>
                  <h3 className="font-display text-lg leading-snug font-semibold text-navy text-balance">
                    <Link
                      to={`/news/${article.slug}`}
                      className="after:absolute after:inset-0 hover:underline"
                    >
                      {article.title}
                    </Link>
                  </h3>
                  {article.excerpt && (
                    <p className="text-sm leading-relaxed text-ink/80">{article.excerpt}</p>
                  )}
                  {article.reading_time_minutes != null && (
                    <p className="mt-1 text-xs text-navy/45">
                      {t.news.readingTime.replace('{n}', article.reading_time_minutes)}
                    </p>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
