import { useEffect, useState } from 'react'
import { useSite } from '@/components/site-provider'
import { apiData } from '@/lib/apiClient'

/**
 * Supporter stories that an admin has approved.
 *
 * Reads `GET /api/community-posts`, which returns APPROVED rows only — the moderation
 * queue in /admin/moderation is what puts them here.
 *
 * Deliberately no fallback to the mock story list on failure. Rendering invented
 * testimonials attributed to named people, in a block headed with real supporters' words,
 * would be worse than showing nothing. An error shows nothing.
 */
export function VoicesFeed() {
  const { t } = useSite()
  const c = t.community
  const [posts, setPosts] = useState(null)

  useEffect(() => {
    let cancelled = false
    void apiData('/api/community-posts')
      .then(({ data }) => !cancelled && setPosts(Array.isArray(data) ? data : []))
      .catch(() => !cancelled && setPosts([]))
    return () => {
      cancelled = true
    }
  }, [])

  // Nothing approved yet is a normal state for a young queue, not an error worth showing.
  if (!posts?.length) return null

  return (
    <section aria-labelledby="voices-heading" className="mt-16">
      <h2 id="voices-heading" className="font-display text-2xl font-semibold text-navy sm:text-3xl">
        {c.voicesTitle}
      </h2>
      <p className="mt-2 max-w-2xl text-navy/70">{c.voicesIntro}</p>

      <ul className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
        {posts.map((post) => (
          <li
            key={post.id}
            className="mb-5 break-inside-avoid rounded-2xl border border-navy/10 bg-white/70 p-5"
          >
            {post.photo_url && (
              <img
                src={post.photo_url}
                // The submitter names themselves; the story is their own words, so the
                // author plus relationship is the most accurate description available.
                alt={`${post.author_name}, ${post.relationship}`}
                className="mb-4 aspect-[4/3] w-full rounded-lg object-cover"
                loading="lazy"
              />
            )}
            <p className="text-navy/80">{post.story}</p>
            <p className="mt-3 text-sm font-semibold text-navy">
              {post.author_name}
              <span className="ml-2 font-normal text-navy/55">{post.relationship}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
