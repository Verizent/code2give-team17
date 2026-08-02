import { useEffect, useState } from 'react'
import {
  fetchAdminWishlist,
  createAdminWishlistItem,
  updateAdminWishlistItem,
  deleteAdminWishlistItem,
  uploadCoverImage,
  type AdminWishlistItem,
} from '@/features/admin/api'

/** Matches createWishlistItemSchema on the server; checked here to save a round trip. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

type FormState = {
  id: string
  title_en: string
  title_zh: string
  why_en: string
  why_zh: string
  needed: string
  image_url: string
  is_active: boolean
}

const EMPTY: FormState = {
  id: '',
  title_en: '',
  title_zh: '',
  why_en: '',
  why_zh: '',
  needed: '1',
  image_url: '',
  is_active: true,
}

const inputClass = 'mt-1 min-h-11 w-full rounded-md border border-navy/15 px-3'
const labelClass = 'text-sm font-semibold text-navy/70'

export function AdminWishlistPage() {
  const [items, setItems] = useState<AdminWishlistItem[]>([])
  const [form, setForm] = useState<FormState>(EMPTY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function load() {
    try {
      setItems(await fetchAdminWishlist())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the wishlist.')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function startCreate() {
    setForm(EMPTY)
    setEditingId(null)
    setShowForm(true)
    setError(null)
    setMsg(null)
  }

  function startEdit(item: AdminWishlistItem) {
    setForm({
      id: item.id,
      title_en: item.title_en,
      title_zh: item.title_zh,
      why_en: item.why_en,
      why_zh: item.why_zh,
      needed: String(item.needed),
      image_url: item.image_url,
      is_active: item.is_active,
    })
    setEditingId(item.id)
    setShowForm(true)
    setError(null)
    setMsg(null)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY)
  }

  async function pickImage(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      set('image_url', await uploadCoverImage(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not upload that image.')
    } finally {
      setUploading(false)
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setMsg(null)

    const needed = Number(form.needed)
    if (!Number.isInteger(needed) || needed < 1) {
      setError('Needed must be a whole number of 1 or more.')
      return
    }
    if (!editingId && !SLUG.test(form.id)) {
      setError('The id must be lowercase words joined by hyphens, e.g. "yoga-mats".')
      return
    }
    if (!form.image_url) {
      setError('Add a photo — the card on /give/wishlist has nothing to show without one.')
      return
    }

    // The editing item's own pledged count is the floor the server enforces; checking it
    // here turns a 400 into a sentence that says what to do instead.
    const editing = editingId ? items.find((i) => i.id === editingId) : null
    if (editing && needed < editing.pledged) {
      setError(
        `Needed cannot drop below the ${editing.pledged} already pledged. Set it to ${editing.pledged} to close this item.`,
      )
      return
    }

    setBusy(true)
    try {
      if (editingId) {
        await updateAdminWishlistItem(editingId, {
          title_en: form.title_en.trim(),
          title_zh: form.title_zh.trim(),
          why_en: form.why_en.trim(),
          why_zh: form.why_zh.trim(),
          needed,
          // Only sent when it actually changed. Seeded rows hold site-relative paths
          // like /brand/member.jpg, and the schema's z.string().url() rejects those —
          // echoing one back would 400 an edit that never touched the photo.
          ...(form.image_url === editing?.image_url ? {} : { image_url: form.image_url }),
          is_active: form.is_active,
        })
        setMsg(`Saved “${form.title_en.trim()}”.`)
      } else {
        await createAdminWishlistItem({
          id: form.id.trim(),
          title_en: form.title_en.trim(),
          title_zh: form.title_zh.trim(),
          why_en: form.why_en.trim(),
          why_zh: form.why_zh.trim(),
          needed,
          image_url: form.image_url,
          is_active: form.is_active,
        })
        setMsg(`Added “${form.title_en.trim()}”.`)
      }
      closeForm()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that item.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(item: AdminWishlistItem) {
    setBusyId(item.id)
    setError(null)
    try {
      await updateAdminWishlistItem(item.id, { is_active: !item.is_active })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change that item.')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(item: AdminWishlistItem) {
    // Deleting an item with pledges against it loses the record of what people promised.
    const warning =
      item.pledged > 0
        ? `“${item.title_en}” has ${item.pledged} pledge${item.pledged === 1 ? '' : 's'} against it. Delete anyway?`
        : `Delete “${item.title_en}”?`
    if (!window.confirm(warning)) return

    setBusyId(item.id)
    setError(null)
    try {
      await deleteAdminWishlistItem(item.id)
      setMsg(`Deleted “${item.title_en}”.`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete that item.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">Wishlist</h1>
          <p className="mt-2 max-w-2xl text-navy/70">
            Items shown on <code className="text-sm">/give/wishlist</code>. Pledges are counted
            by supporters and cannot be edited here.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={startCreate}
            className="min-h-11 rounded-md bg-navy px-4 text-sm font-semibold text-white sm:px-6"
          >
            Add item
          </button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-red/10 px-3 py-2 text-sm font-medium text-red"
        >
          {error}
        </p>
      )}
      {msg && (
        <p role="status" className="mt-4 rounded-md bg-teal/10 px-3 py-2 text-sm font-medium text-teal">
          {msg}
        </p>
      )}

      {showForm && (
        <form onSubmit={save} className="mt-6 grid gap-3 rounded-lg border border-navy/10 p-4 sm:grid-cols-2">
          <h2 className="font-display text-lg font-semibold text-navy sm:col-span-2">
            {editingId ? `Edit ${editingId}` : 'New item'}
          </h2>

          <label className="sm:col-span-2">
            <span className={labelClass}>
              Id {editingId ? '(fixed — it is the public link)' : '(lowercase-with-hyphens)'}
            </span>
            <input
              value={form.id}
              onChange={(e) => set('id', e.target.value)}
              disabled={Boolean(editingId)}
              required
              placeholder="yoga-mats"
              className={`${inputClass} disabled:bg-navy/5 disabled:text-navy/50`}
            />
          </label>

          <label>
            <span className={labelClass}>Title (EN)</span>
            <input
              value={form.title_en}
              onChange={(e) => set('title_en', e.target.value)}
              required
              maxLength={200}
              className={inputClass}
            />
          </label>
          <label>
            <span className={labelClass}>Title (繁體)</span>
            <input
              value={form.title_zh}
              onChange={(e) => set('title_zh', e.target.value)}
              required
              maxLength={200}
              className={inputClass}
            />
          </label>

          <label>
            <span className={labelClass}>Why it is needed (EN)</span>
            <textarea
              value={form.why_en}
              onChange={(e) => set('why_en', e.target.value)}
              required
              maxLength={1000}
              rows={3}
              className="mt-1 w-full rounded-md border border-navy/15 px-3 py-2"
            />
          </label>
          <label>
            <span className={labelClass}>Why it is needed (繁體)</span>
            <textarea
              value={form.why_zh}
              onChange={(e) => set('why_zh', e.target.value)}
              required
              maxLength={1000}
              rows={3}
              className="mt-1 w-full rounded-md border border-navy/15 px-3 py-2"
            />
          </label>

          <label>
            <span className={labelClass}>Needed</span>
            <input
              type="number"
              min={1}
              value={form.needed}
              onChange={(e) => set('needed', e.target.value)}
              required
              className={inputClass}
            />
          </label>

          <div>
            <span className={labelClass}>Photo</span>
            <div className="mt-1 flex items-center gap-3">
              {form.image_url && (
                <img src={form.image_url} alt="" className="h-11 w-11 rounded-md object-cover" />
              )}
              <label className="min-h-11 cursor-pointer rounded-md border border-navy/20 px-3 py-2 text-sm font-semibold text-navy">
                {uploading ? 'Uploading…' : form.image_url ? 'Replace' : 'Upload'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => void pickImage(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm font-semibold text-navy/70">
              Show on the public wishlist
            </span>
          </label>

          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={busy || uploading}
              className="min-h-11 rounded-md bg-navy px-6 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add item'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="min-h-11 rounded-md border border-navy/20 px-4 text-sm font-semibold text-navy"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="mt-8 text-navy/70">No wishlist items yet.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start gap-4 border-b border-navy/10 pb-4"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-navy/5 text-xs text-navy/40">
                  No photo
                </span>
              )}

              <div className="min-w-[16rem] flex-1">
                <p className="font-semibold text-navy">
                  {item.title_en}
                  {!item.is_active && (
                    <span className="ml-2 rounded bg-navy/10 px-2 py-0.5 text-xs font-semibold text-navy/60">
                      Hidden
                    </span>
                  )}
                </p>
                <p className="text-sm text-navy/60">{item.title_zh}</p>
                <p className="mt-1 text-sm text-navy/75">{item.why_en}</p>
                <p className="mt-1 text-xs text-navy/45">{item.id}</p>
                <p className="mt-2 text-sm font-semibold text-navy/70">
                  {item.pledged} of {item.needed} pledged
                  {item.pledged >= item.needed && (
                    <span className="ml-2 text-teal">Fully pledged</span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="min-h-11 rounded-md border border-navy/20 px-3 text-sm font-semibold text-navy"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void toggleActive(item)}
                  className="min-h-11 rounded-md border border-navy/20 px-3 text-sm font-semibold text-navy disabled:opacity-50"
                >
                  {item.is_active ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void remove(item)}
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
