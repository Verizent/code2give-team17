import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { mediaItems } from '@/lib/mock'

/**
 * Bottom-of-community teaser — points people to the full articles index
 * instead of embedding the press carousel on this page.
 */
export function ArticlesCta() {
  const { locale, t } = useSite()
  const preview = mediaItems.slice(0, 3)

  return (
    <section
      aria-labelledby="articles-cta-title"
      className="border-t border-navy/10 bg-[#f8f7f3] px-5 py-14 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-[1120px]">
        <p className="kicker text-teal">{t.mediaNews.eyebrow}</p>
        <h2
          id="articles-cta-title"
          className="mt-2 max-w-2xl font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-navy"
        >
          {t.mediaNews.title}
        </h2>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-navy/70 sm:text-lg">
          {t.mediaNews.subhead}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {preview.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-md border border-navy/10 bg-white"
            >
              <div className="aspect-[16/10] overflow-hidden bg-navy/10">
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-navy/50">{item.date[locale]}</p>
                <p className="mt-1 line-clamp-2 text-sm font-bold text-navy">
                  {item.title[locale]}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link
            to="/articles"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            {t.mediaNews.cta}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
