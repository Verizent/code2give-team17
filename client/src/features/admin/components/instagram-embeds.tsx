import { useEffect, useState } from 'react'
import {
  fetchAdminInstagram,
  createInstagramEmbed,
  updateInstagramEmbed,
  deleteInstagramEmbed,
  type InstagramEmbed,
} from '@/features/admin/api'

type Copy = {
  title: string
  intro: string
  urlLabel: string
  captionLabel: string
  orderLabel: string
  add: string
  empty: string
  active: string
  hidden: string
  remove: string
  confirmRemove: string
  cancel: string
  error: string
}

/**
 * Manages which Instagram posts appear on the public Community page.
 *
 * Stores a permalink, not an embed. The public strip renders a link card rather than
 * Instagram's embed.js, so nothing here can put third-party script on the page.
 */
export function InstagramEmbeds({ copy }: { copy: Copy }) {
  const [embeds, setEmbeds] = useState<InstagramEmbed[]>([])
  const [url, setUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  // Deleting is irreversible, so it takes two clicks: the first arms this, the second acts.
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  async function load() {
    try {
      setEmbeds(await fetchAdminInstagram())
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function add(event: React.FormEvent) {
    event.preventDefault()
    if (!url.trim()) return

    setBusy(true)
    try {
      await createInstagramEmbed({
        url: url.trim(),
        caption_en: caption.trim() || undefined,
        display_order: embeds.length + 1,
      })
      setUrl('')
      setCaption('')
      await load()
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  async function toggle(embed: InstagramEmbed) {
    setBusy(true)
    try {
      await updateInstagramEmbed(embed.id, { is_active: !embed.is_active })
      await load()
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    setBusy(true)
    try {
      await deleteInstagramEmbed(id)
      setPendingDelete(null)
      await load()
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="instagram-admin" className="mt-14 border-t border-navy/10 pt-10">
      <h2 id="instagram-admin" className="font-display text-2xl font-semibold text-navy">
        {copy.title}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-navy/65">{copy.intro}</p>

      {failed && (
        <p className="mt-4 rounded-md bg-red/10 px-4 py-3 text-sm text-red">{copy.error}</p>
      )}

      <form onSubmit={add} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-semibold text-navy">
          {copy.urlLabel}
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/…"
            className="mt-1 block w-full rounded-md border border-navy/20 px-3 py-2 font-normal"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-navy">
          {copy.captionLabel}
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="mt-1 block w-full rounded-md border border-navy/20 px-3 py-2 font-normal"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 shrink-0 rounded-md bg-navy px-4 font-semibold text-white disabled:opacity-50"
        >
          {copy.add}
        </button>
      </form>

      {embeds.length === 0 ? (
        <p className="mt-6 text-sm text-navy/55">{copy.empty}</p>
      ) : (
        <ul className="mt-6 divide-y divide-navy/10 border-y border-navy/10">
          {embeds.map((embed) => (
            <li key={embed.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy">{embed.caption_en || embed.url}</p>
                <p className="truncate text-sm text-navy/55">{embed.url}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => void toggle(embed)}
                  disabled={busy}
                  className="min-h-11 text-sm font-semibold text-teal disabled:opacity-50"
                >
                  {embed.is_active ? copy.active : copy.hidden}
                </button>
                {pendingDelete === embed.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void remove(embed.id)}
                      disabled={busy}
                      className="min-h-11 text-sm font-semibold text-red disabled:opacity-50"
                    >
                      {copy.confirmRemove}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(null)}
                      className="min-h-11 text-sm text-navy/60"
                    >
                      {copy.cancel}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPendingDelete(embed.id)}
                    className="min-h-11 text-sm text-navy/60 hover:text-red"
                  >
                    {copy.remove}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
