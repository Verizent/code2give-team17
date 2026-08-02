import { useState } from 'react'
import { Instagram } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { cn } from '@/lib/utils'

const ACCOUNT = '@love21foundation'

/**
 * An Instagram post on the Ability Wall, in the same card shell as a Voices story.
 *
 * The middle of the card is Instagram's own `/embed/captioned/` frame — the real post,
 * no API token and no embed.js, which is what that endpoint exists for. The chrome
 * around it is ours, so the card reads as part of the wall rather than as a pasted-in
 * widget.
 *
 * A cross-origin frame cannot be reliably error-detected: `onError` does not fire for a
 * blocked third-party frame, and a blocked frame paints opaque white rather than staying
 * transparent. So the thumbnail is shown until `onLoad` fires, and a frame that never
 * loads simply leaves the thumbnail in place instead of turning into a white box.
 */
export function InstagramCard({ embed }) {
  const { t } = useSite()
  const [loaded, setLoaded] = useState(false)

  const postUrl = `https://www.instagram.com/p/${embed.shortcode}/`

  return (
    <article className="break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <a
        href={postUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 hover:bg-muted/40"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink/40 text-navy"
          >
            <Instagram className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-navy">{ACCOUNT}</p>
            <p className="text-xs text-navy/45">{t.community.instagramLabel}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-pink/25 px-3 py-1 text-xs font-semibold text-navy">
          {t.community.instagramTag}
        </span>
      </a>

      <div className="relative bg-muted" style={{ aspectRatio: '4 / 5' }}>
        {/* Sits under the frame and is simply covered once the real post paints. */}
        {embed.thumbnail_url && (
          <img
            src={embed.thumbnail_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <iframe
          src={`https://www.instagram.com/p/${embed.shortcode}/embed/captioned/`}
          title={embed.caption || `${ACCOUNT} on Instagram`}
          loading="lazy"
          scrolling="no"
          allowtransparency="true"
          onLoad={() => setLoaded(true)}
          className={cn(
            'absolute inset-0 h-full w-full border-0 transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      </div>

      <a href={postUrl} target="_blank" rel="noreferrer" className="block px-4 pt-3 pb-4">
        {embed.caption && (
          <p className="text-base leading-relaxed text-ink/85">{embed.caption}</p>
        )}
        <span className="mt-2 inline-block text-sm font-semibold text-teal underline">
          {t.community.instagramCta}
        </span>
      </a>
    </article>
  )
}
