import { useCallback, useEffect, useState } from 'react'
import {
  fetchInstagramEmbeds,
  createInstagramEmbed,
  updateInstagramEmbed,
  deleteInstagramEmbed,
  type AdminInstagramEmbed,
} from '@/features/admin/api'
import { uploadCommunityPhoto } from '@/features/content/api'

/**
 * Curate the Instagram posts shown on the Community wall.
 *
 * `display_order` is not cosmetic here — the wall places an embed after
 * `display_order × 3` stories, so changing it moves the card.
 */
export function AdminInstagramPage() {
  const [embeds, setEmbeds] = useState<AdminInstagramEmbed[]>([])
  const [url, setUrl] = useState('')
  const [captionEn, setCaptionEn] = useState('')
  const [captionZh, setCaptionZh] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    try {
      setEmbeds(await fetchInstagramEmbeds())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load embeds.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function add(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setAdding(true)
    try {
      await createInstagramEmbed({
        url: url.trim(),
        caption_en: captionEn.trim() || null,
        caption_zh: captionZh.trim() || null,
        // Append rather than collide with an existing position.
        display_order: embeds.reduce((max, e) => Math.max(max, e.display_order), 0) + 1,
      })
      setUrl('')
      setCaptionEn('')
      setCaptionZh('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add that post.')
    } finally {
      setAdding(false)
    }
  }

  async function mutate(id: string, body: Partial<AdminInstagramEmbed>) {
    setBusyId(id)
    setError(null)
    try {
      await updateInstagramEmbed(id, body)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that change.')
    } finally {
      setBusyId(null)
    }
  }

  async function pickThumbnail(id: string, file: File | undefined) {
    if (!file) return
    setBusyId(id)
    setError(null)
    try {
      const thumbnail_url = await uploadCommunityPhoto(file)
      await updateInstagramEmbed(id, { thumbnail_url })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not upload that thumbnail.')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: string) {
    setBusyId(id)
    try {
      await deleteInstagramEmbed(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete that embed.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Instagram on the wall</h1>
      <p className="mt-2 max-w-2xl text-navy/70">
        Posts shown on the Community wall. Order decides placement — an embed appears after{' '}
        <code className="text-sm">display_order × 3</code> stories. A thumbnail is shown if
        Instagram cannot be reached.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red/10 px-3 py-2 text-sm font-medium text-red">
          {error}
        </p>
      )}

      <form onSubmit={add} className="mt-6 grid gap-3 rounded-lg border border-navy/10 p-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-sm font-semibold text-navy/70">Post URL</span>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/…"
            className="mt-1 min-h-11 w-full rounded-md border border-navy/15 px-3"
          />
        </label>
        <label>
          <span className="text-sm font-semibold text-navy/70">Caption (EN)</span>
          <input
            value={captionEn}
            onChange={(e) => setCaptionEn(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-md border border-navy/15 px-3"
          />
        </label>
        <label>
          <span className="text-sm font-semibold text-navy/70">Caption (繁體)</span>
          <input
            value={captionZh}
            onChange={(e) => setCaptionZh(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-md border border-navy/15 px-3"
          />
        </label>
        <button
          type="submit"
          disabled={adding || url.trim() === ''}
          className="min-h-11 rounded-md bg-navy px-4 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2 sm:justify-self-start sm:px-6"
        >
          {adding ? 'Adding…' : 'Add post'}
        </button>
      </form>

      {embeds.length === 0 ? (
        <p className="mt-8 text-navy/70">No Instagram posts yet.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {embeds.map((embed) => (
            <li
              key={embed.id}
              className="flex flex-wrap items-start gap-4 border-b border-navy/10 pb-4"
            >
              {embed.thumbnail_url ? (
                <img
                  src={embed.thumbnail_url}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-navy/5 text-xs text-navy/40">
                  No still
                </span>
              )}

              <div className="min-w-[16rem] flex-1">
                <a
                  href={embed.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold break-all text-teal underline"
                >
                  {embed.url}
                </a>
                <p className="mt-1 text-navy/85">{embed.caption_en || <em>No caption</em>}</p>
                <p className="text-sm text-navy/60">{embed.caption_zh}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm text-navy/70">
                  Order
                  <input
                    type="number"
                    min={1}
                    defaultValue={embed.display_order}
                    onBlur={(e) => {
                      const next = Number(e.target.value)
                      if (next !== embed.display_order) void mutate(embed.id, { display_order: next })
                    }}
                    className="ml-2 min-h-11 w-20 rounded-md border border-navy/15 px-2"
                  />
                </label>

                <label className="min-h-11 cursor-pointer rounded-md border border-navy/20 px-3 py-2 text-sm font-semibold text-navy">
                  Still
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => void pickThumbnail(embed.id, e.target.files?.[0])}
                  />
                </label>

                <button
                  type="button"
                  disabled={busyId === embed.id}
                  onClick={() => void mutate(embed.id, { is_active: !embed.is_active })}
                  className="min-h-11 rounded-md border border-navy/20 px-3 text-sm font-semibold text-navy disabled:opacity-50"
                >
                  {embed.is_active ? 'Hide' : 'Show'}
                </button>

                <button
                  type="button"
                  disabled={busyId === embed.id}
                  onClick={() => void remove(embed.id)}
                  className="min-h-11 rounded-md border border-red/30 px-3 text-sm font-semibold text-red disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
