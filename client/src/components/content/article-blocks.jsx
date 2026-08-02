import { useSite } from '@/components/site-provider'

/**
 * Renders the JSONB block array from `articles.body_en` / `body_zh`.
 *
 * `paragraph.text` is inline markdown in the schema, but react-markdown is not a
 * dependency of this workspace and adding one is a shared-file change for the team,
 * so text renders verbatim. Any markdown syntax shows as literal characters — a
 * cosmetic limit, not a correctness one. Nothing here uses dangerouslySetInnerHTML,
 * and the closed block union is what keeps raw HTML out (CONTEXT §21).
 */
export function ArticleBlocks({ blocks }) {
  const { t } = useSite()

  if (!Array.isArray(blocks)) return null

  return (
    <>
      {blocks.map((block, i) => {
        const key = `${block.type}-${i}`

        switch (block.type) {
          case 'paragraph':
            return (
              <p key={key} className="mt-5 text-base leading-relaxed text-ink/85 sm:text-lg">
                {block.text}
              </p>
            )

          case 'heading': {
            const Tag = block.level === 3 ? 'h3' : 'h2'
            return (
              <Tag
                key={key}
                className={
                  block.level === 3
                    ? 'mt-8 font-display text-lg font-semibold text-navy sm:text-xl'
                    : 'mt-10 font-display text-xl font-semibold text-navy sm:text-2xl'
                }
              >
                {block.text}
              </Tag>
            )
          }

          case 'image':
            return (
              <figure key={key} className="mt-8">
                <img
                  src={block.url}
                  alt={block.alt}
                  className="w-full rounded-2xl object-cover"
                  loading="lazy"
                />
                {block.caption && (
                  <figcaption className="mt-2 text-sm text-navy/55">{block.caption}</figcaption>
                )}
              </figure>
            )

          case 'quote':
            return (
              <figure key={key} className="mt-8 border-l-4 border-yellow pl-5">
                <blockquote className="font-display text-lg leading-snug text-navy sm:text-xl">
                  {block.text}
                </blockquote>
                {block.attribution && (
                  <figcaption className="mt-2 text-sm text-navy/55">
                    {block.attribution}
                  </figcaption>
                )}
              </figure>
            )

          case 'stat':
            return (
              <div key={key} className="mt-8 rounded-2xl bg-teal/10 p-6">
                <p className="font-display text-3xl font-bold text-teal sm:text-4xl">
                  {block.value}
                </p>
                <p className="mt-1 font-semibold text-navy">{block.label}</p>
                {block.sublabel && (
                  <p className="mt-1 text-sm text-navy/60">{block.sublabel}</p>
                )}
              </div>
            )

          case 'mythFact':
            return (
              <div key={key} className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted p-5">
                  <p className="text-xs font-semibold tracking-wide text-navy/50 uppercase">
                    {t.news.mythLabel}
                  </p>
                  <p className="mt-2 leading-relaxed text-ink/80">{block.myth}</p>
                </div>
                <div className="rounded-2xl border border-teal/30 bg-teal/10 p-5">
                  <p className="text-xs font-semibold tracking-wide text-teal uppercase">
                    {t.news.factLabel}
                  </p>
                  <p className="mt-2 leading-relaxed text-ink/85">{block.fact}</p>
                </div>
              </div>
            )

          case 'embed':
            // DEMO-ONLY: no Instagram embed script is loaded, so this renders a link
            // out rather than the post. Real version needs the oEmbed script.
            return (
              <p key={key} className="mt-8">
                <a
                  href={`https://www.instagram.com/p/${block.postId}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-teal underline"
                >
                  {t.news.embedFallback}
                </a>
              </p>
            )

          default:
            // An unknown block type is newer content than this client understands.
            // Skipping beats crashing the whole article.
            return null
        }
      })}
    </>
  )
}
