import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { apiData } from '@/lib/apiClient'

/**
 * Instagram posts an admin has pinned to this page, from `GET /api/instagram`.
 *
 * Rendered as cards linking out, NOT as Instagram's official embed. Their embed.js
 * injects third-party script into the page and the repo forbids
 * `dangerouslySetInnerHTML` outright; a permalink carries the same content without
 * handing a script tag to another origin.
 *
 * Separate from the media carousel above it, which is press coverage — different source,
 * different content, so this adds a strip rather than replacing that one.
 */
export function InstagramStrip() {
  const { locale, t } = useSite()
  const c = t.community
  const [embeds, setEmbeds] = useState(null)

  useEffect(() => {
    let cancelled = false
    void apiData('/api/instagram')
      .then(({ data }) => !cancelled && setEmbeds(Array.isArray(data) ? data : []))
      .catch(() => !cancelled && setEmbeds([]))
    return () => {
      cancelled = true
    }
  }, [])

  if (!embeds?.length) return null

  return (
    <section aria-labelledby="instagram-heading" className="mt-16">
      <h2
        id="instagram-heading"
        className="font-display text-2xl font-semibold text-navy sm:text-3xl"
      >
        {c.instagramTitle}
      </h2>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {embeds.map((embed) => {
          const caption =
            (locale === 'en' ? embed.caption_en : embed.caption_zh) || embed.caption_en || ''
          return (
            <li key={embed.id}>
              <a
                href={embed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full flex-col justify-between gap-3 rounded-xl border border-navy/10 bg-white/70 p-4 transition-colors hover:border-teal/40"
              >
                <p className="text-sm leading-relaxed text-navy/80">{caption}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal">
                  {c.instagramOpen}
                  <ExternalLink aria-hidden className="h-4 w-4" />
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
