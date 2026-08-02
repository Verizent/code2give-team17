import { useEffect, useState } from 'react'
import {
  fetchCommunityPosts,
  moderateCommunityPost,
  type CommunityPost,
} from '@/features/admin/api'
import { useSite } from '@/components/site-provider'
import { ApiError } from '@/lib/apiClient'

export function AdminModerationPage() {
  const { t } = useSite()
  const a = t.admin
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [available, setAvailable] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    try {
      const result = await fetchCommunityPosts('pending')
      setPosts(result.items)
      setAvailable(result.available)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setError('Could not load Voices queue.')
      } else {
        setError('Could not load Voices queue.')
      }
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function decide(id: string, status: 'approved' | 'rejected') {
    setBusyId(id)
    try {
      await moderateCommunityPost(id, status)
      await load()
    } catch {
      setError('Could not update post status.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">{a.moderationTitle}</h1>
      <p className="mt-2 max-w-2xl text-navy/70">{a.moderationIntro}</p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red/10 px-3 py-2 text-sm text-red">
          {error}
        </p>
      )}

      {!available ? (
        <p className="mt-8 max-w-xl text-navy/70">
          Voices moderation is not available yet — the <code className="text-sm">community_posts</code>{' '}
          table still needs to be applied to the shared project. Nothing is broken on the public
          site; this queue will light up once that migration lands.
        </p>
      ) : posts.length === 0 ? (
        <p className="mt-8 text-navy/70">No Voices waiting for review.</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {posts.map((post) => (
            <li key={post.id} className="border-b border-navy/10 pb-6">
              <p className="text-sm font-semibold text-navy/55">
                {post.author_name} · {post.relationship}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-navy/85">{post.story}</p>
              {/* Approving a photo you cannot see is not moderation. */}
              {post.photo_url && (
                <img
                  src={post.photo_url}
                  alt={`Photo submitted by ${post.author_name}`}
                  className="mt-3 max-h-72 rounded-lg border border-navy/10 object-contain"
                />
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === post.id}
                  onClick={() => void decide(post.id, 'approved')}
                  className="min-h-11 rounded-md bg-teal px-4 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === post.id}
                  onClick={() => void decide(post.id, 'rejected')}
                  className="min-h-11 rounded-md border border-navy/20 px-4 text-sm font-semibold text-navy disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
