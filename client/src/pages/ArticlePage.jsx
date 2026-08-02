import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { ArticleBlocks } from '@/components/content/article-blocks'
import { getArticle } from '@/features/content/api'

// Script subtags are well-formed for Intl but give no region to format a date from,
// so zh-Hant/zh-Hans fall back to English-style output. Map to a region tag instead.
const DATE_LOCALE = { en: 'en', 'zh-Hant': 'zh-TW', 'zh-Hans': 'zh-CN' }

export function ArticlePage() {
  const { slug } = useParams()
  const { locale, t } = useSite()
  const [article, setArticle] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setArticle(null)
    setError(null)

    getArticle(slug, locale)
      .then((data) => {
        if (!cancelled) setArticle(data)
      })
      .catch((err) => {
        // 404 is a real answer (no such story); anything else is a failure the
        // visitor may be able to retry. The copy differs so they are not told to
        // retry something that will never succeed.
        if (!cancelled) setError(err.status === 404 ? 'notFound' : 'loadFailed')
      })

    return () => {
      cancelled = true
    }
  }, [slug, locale])

  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="mx-auto max-w-[720px] px-5 py-12 sm:px-8 sm:py-16">
        {error ? (
          <>
            <p className="text-lg text-ink/80">{t.news[error]}</p>
            <Link to="/#news" className="mt-6 inline-block font-semibold text-teal underline">
              {t.news.backToNews}
            </Link>
          </>
        ) : article ? (
          <article>
            <p className="text-xs font-semibold tracking-wide text-teal uppercase">
              {t.news.categories[article.category] ?? article.category}
            </p>
            <h1 className="mt-3 font-display text-[clamp(1.85rem,5vw,2.75rem)] leading-tight font-semibold text-navy text-balance">
              {article.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-3 text-sm text-navy/55">
              {article.author && <span>{article.author}</span>}
              {article.published_at && (
                <time dateTime={article.published_at}>
                  {new Date(article.published_at).toLocaleDateString(
                    DATE_LOCALE[locale] ?? 'en',
                  )}
                </time>
              )}
              {article.reading_time_minutes != null && (
                <span>{t.news.readingTime.replace('{n}', article.reading_time_minutes)}</span>
              )}
            </div>

            {article.cover_image_url && (
              <img
                src={article.cover_image_url}
                alt={article.cover_alt ?? ''}
                className="mt-8 w-full rounded-2xl object-cover"
              />
            )}

            <ArticleBlocks blocks={article.body} />

            <Link to="/#news" className="mt-12 inline-block font-semibold text-teal underline">
              {t.news.backToNews}
            </Link>
          </article>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  )
}
