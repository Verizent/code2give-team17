import { useEffect, useState } from 'react'
import {
  deleteCommunityPost,
  fetchCommunityPosts,
  moderateCommunityPost,
  type CommunityPost,
} from '@/features/admin/api'
import { useSite } from '@/components/site-provider'
import { ApiError } from '@/lib/apiClient'

const TABS = ['pending', 'approved', 'rejected'] as const
type Tab = (typeof TABS)[number]

export function AdminModerationPage() {
  const { t } = useSite()
  const a = t.admin
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [available, setAvailable] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('pending')
  // Delete here is a hard delete with no undo, so it asks twice before firing.
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

  async function load(status: Tab) {
    try {
      const result = await fetchCommunityPosts(status)
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
    void load(tab)
  }, [tab])

  async function decide(id: string, status: 'approved' | 'rejected') {
    setBusyId(id)
    try {
      await moderateCommunityPost(id, status)
      await load(tab)
    } catch {
      setError('Could not update post status.')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: string) {
    setBusyId(id)
    try {
      await deleteCommunityPost(id)
      setConfirmingDelete(null)
      await load(tab)
    } catch {
      setError('Could not delete this post.')
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

      <div className="mt-6 flex flex-wrap gap-1" role="tablist" aria-label="Voices status">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => {
              setTab(name)
              setConfirmingDelete(null)
            }}
            className={[
              'min-h-11 rounded-md px-4 text-sm font-semibold capitalize',
              tab === name
                ? 'bg-navy text-white'
                : 'border border-navy/20 text-navy hover:bg-navy/5',
            ].join(' ')}
          >
            {name}
          </button>
        ))}
      </div>

      {!available ? (
        <p className="mt-8 max-w-xl text-navy/70">
          Voices moderation is not available yet — the <code className="text-sm">community_posts</code>{' '}
          table still needs to be applied to the shared project. Nothing is broken on the public
          site; this queue will light up once that migration lands.
        </p>
      ) : posts.length === 0 ? (
        <p className="mt-8 text-navy/70">
          {tab === 'pending'
            ? 'No Voices waiting for review.'
            : `No ${tab} Voices.`}
        </p>
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
              <div className="mt-4 flex flex-wrap gap-2">
                {post.status !== 'approved' && (
                  <button
                    type="button"
                    disabled={busyId === post.id}
                    onClick={() => void decide(post.id, 'approved')}
                    className="min-h-11 rounded-md bg-teal px-4 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Approve
                  </button>
                )}
                {post.status !== 'rejected' && (
                  <button
                    type="button"
                    disabled={busyId === post.id}
                    onClick={() => void decide(post.id, 'rejected')}
                    className="min-h-11 rounded-md border border-navy/20 px-4 text-sm font-semibold text-navy disabled:opacity-60"
                  >
                    Reject
                  </button>
                )}
                {confirmingDelete === post.id ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === post.id}
                      onClick={() => void remove(post.id)}
                      className="min-h-11 rounded-md bg-red px-4 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      disabled={busyId === post.id}
                      onClick={() => setConfirmingDelete(null)}
                      className="min-h-11 rounded-md border border-navy/20 px-4 text-sm font-semibold text-navy disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === post.id}
                    onClick={() => setConfirmingDelete(post.id)}
                    className="min-h-11 rounded-md border border-red/30 px-4 text-sm font-semibold text-red disabled:opacity-60"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
