import { useEffect, useState, type FormEvent } from 'react'
import {
  createAdminArticle,
  uploadCoverImage,
  fetchAdminArticle,
  fetchAdminArticles,
  publishAdminArticle,
  unpublishAdminArticle,
  updateAdminArticle,
  type AdminArticle,
  type ArticleWritePayload,
} from '@/features/admin/api'
import { ApiError } from '@/lib/apiClient'
import { useSite } from '@/components/site-provider'
import { cn } from '@/lib/utils'

function blocksToText(blocks: Array<{ type: string; text?: string }> | undefined) {
  if (!blocks?.length) return ''
  return blocks
    .filter((b) => b.type === 'paragraph' && b.text)
    .map((b) => b.text)
    .join('\n\n')
}

function textToBlocks(text: string): Array<{ type: 'paragraph'; text: string }> {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((t) => ({ type: 'paragraph' as const, text: t }))
}

type FormState = {
  category: 'news' | 'education' | 'report'
  title_en: string
  title_zh: string
  excerpt_en: string
  excerpt_zh: string
  body_en: string
  body_zh: string
  author: string
  cover_image_url: string
  is_featured: boolean
}

const EMPTY_FORM: FormState = {
  category: 'news',
  title_en: '',
  title_zh: '',
  excerpt_en: '',
  excerpt_zh: '',
  body_en: '',
  body_zh: '',
  author: '',
  cover_image_url: '',
  is_featured: false,
}

function toPayload(form: FormState): ArticleWritePayload {
  return {
    category: form.category,
    title_en: form.title_en.trim(),
    title_zh: form.title_zh.trim() || undefined,
    excerpt_en: form.excerpt_en.trim() || undefined,
    excerpt_zh: form.excerpt_zh.trim() || undefined,
    body_en: textToBlocks(form.body_en),
    body_zh: textToBlocks(form.body_zh),
    author: form.author.trim() || undefined,
    cover_image_url: form.cover_image_url.trim() || undefined,
    is_featured: form.is_featured,
  }
}

/**
 * Articles CMS — list / create / edit / publish against live `/api/admin/articles`.
 * Body editor is pragmatic paragraph text (saved as JSONB paragraph blocks).
 */
export function AdminArticlesPage() {
  const { t } = useSite()
  const a = t.admin
  const [items, setItems] = useState<AdminArticle[]>([])
  const [available, setAvailable] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    try {
      const result = await fetchAdminArticles('all')
      setItems(result.items)
      setAvailable(result.available)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? a.articlesLoadError : a.articlesLoadError)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function startCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setMsg(null)
  }

  async function startEdit(id: string) {
    setBusy(true)
    setMsg(null)
    try {
      const article = await fetchAdminArticle(id)
      setEditingId(article.id)
      setForm({
        category: article.category,
        title_en: article.title_en,
        title_zh: article.title_zh ?? '',
        excerpt_en: article.excerpt_en ?? '',
        excerpt_zh: article.excerpt_zh ?? '',
        body_en: blocksToText(article.body_en),
        body_zh: blocksToText(article.body_zh),
        author: article.author ?? '',
        cover_image_url: article.cover_image_url ?? '',
        is_featured: article.is_featured,
      })
      setShowForm(true)
    } catch {
      setError(a.articlesLoadError)
    } finally {
      setBusy(false)
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!form.title_en.trim()) {
      setError(a.articlesTitleRequired)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload = toPayload(form)
      if (editingId) {
        await updateAdminArticle(editingId, payload)
        setMsg(a.articlesSaved)
      } else {
        const created = await createAdminArticle(payload)
        setEditingId(created.id)
        setMsg(a.articlesCreated)
      }
      await load()
    } catch {
      setError(a.articlesSaveError)
    } finally {
      setBusy(false)
    }
  }

  async function onPublish(id: string) {
    setBusy(true)
    try {
      await publishAdminArticle(id)
      setMsg(a.articlesPublished)
      await load()
    } catch {
      setError(a.articlesSaveError)
    } finally {
      setBusy(false)
    }
  }

  async function onUnpublish(id: string) {
    setBusy(true)
    try {
      await unpublishAdminArticle(id)
      setMsg(a.articlesUnpublished)
      await load()
    } catch {
      setError(a.articlesSaveError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">
            {a.articlesTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-navy/70">{a.articlesIntro}</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex min-h-11 items-center rounded-md bg-teal px-4 text-sm font-semibold text-white"
        >
          {a.articlesNew}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red/10 px-3 py-2 text-sm text-red">
          {error}
        </p>
      )}
      {msg && (
        <p className="mt-4 text-sm font-medium text-teal" role="status">
          {msg}
        </p>
      )}

      {!available ? (
        <p className="mt-8 max-w-xl text-navy/70">{a.articlesUnavailable}</p>
      ) : null}

      {showForm && (
        <form
          onSubmit={(e) => void onSave(e)}
          className="mt-10 space-y-4 border-t border-navy/10 pt-8"
        >
          <h2 className="font-display text-xl font-semibold text-navy">
            {editingId ? a.articlesEdit : a.articlesNew}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-semibold text-navy">{a.articlesFieldCategory}</span>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as FormState['category'],
                  }))
                }
                className="mt-1 w-full rounded-md border border-navy/15 bg-white px-3 py-2"
              >
                <option value="news">news</option>
                <option value="education">education</option>
                <option value="report">report</option>
              </select>
            </label>
            <label className="flex items-end gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
              />
              <span className="font-semibold text-navy">{a.articlesFieldFeatured}</span>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold text-navy">{a.articlesFieldTitleEn}</span>
              <input
                required
                value={form.title_en}
                onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
                className="mt-1 w-full rounded-md border border-navy/15 bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold text-navy">{a.articlesFieldTitleZh}</span>
              <input
                value={form.title_zh}
                onChange={(e) => setForm((f) => ({ ...f, title_zh: e.target.value }))}
                className="mt-1 w-full rounded-md border border-navy/15 bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-navy">{a.articlesFieldExcerptEn}</span>
              <textarea
                rows={2}
                value={form.excerpt_en}
                onChange={(e) => setForm((f) => ({ ...f, excerpt_en: e.target.value }))}
                className="mt-1 w-full rounded-md border border-navy/15 bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-navy">{a.articlesFieldExcerptZh}</span>
              <textarea
                rows={2}
                value={form.excerpt_zh}
                onChange={(e) => setForm((f) => ({ ...f, excerpt_zh: e.target.value }))}
                className="mt-1 w-full rounded-md border border-navy/15 bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold text-navy">{a.articlesFieldBodyEn}</span>
              <textarea
                rows={6}
                value={form.body_en}
                onChange={(e) => setForm((f) => ({ ...f, body_en: e.target.value }))}
                className="mt-1 w-full rounded-md border border-navy/15 bg-white px-3 py-2"
                placeholder={a.articlesBodyHint}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold text-navy">{a.articlesFieldBodyZh}</span>
              <textarea
                rows={6}
                value={form.body_zh}
                onChange={(e) => setForm((f) => ({ ...f, body_zh: e.target.value }))}
                className="mt-1 w-full rounded-md border border-navy/15 bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-navy">{a.articlesFieldAuthor}</span>
              <input
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                className="mt-1 w-full rounded-md border border-navy/15 bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-navy">{a.articlesFieldCover}</span>
              <input
                value={form.cover_image_url}
                onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
                className="mt-1 w-full rounded-md border border-navy/15 bg-white px-3 py-2"
              />
              {/* Upload writes the URL back into the field above, so a pasted link and an
                  uploaded file end up in exactly the same place. */}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploading(true)
                  setError(null)
                  try {
                    const url = await uploadCoverImage(file)
                    setForm((f) => ({ ...f, cover_image_url: url }))
                  } catch {
                    setError(a.articlesCoverUploadError)
                  } finally {
                    setUploading(false)
                    e.target.value = ''
                  }
                }}
                className="mt-2 w-full text-sm"
              />
              <span className="mt-1 block text-xs text-navy/55">
                {uploading ? a.articlesCoverUploading : a.articlesCoverHint}
              </span>
              {form.cover_image_url && (
                <img
                  src={form.cover_image_url}
                  alt=""
                  className="mt-2 h-24 w-full rounded-md object-cover"
                />
              )}
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-11 items-center rounded-md bg-teal px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {a.articlesSave}
            </button>
            {editingId && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onPublish(editingId)}
                  className="inline-flex min-h-11 items-center rounded-md bg-navy px-4 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {a.articlesPublish}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onUnpublish(editingId)}
                  className="inline-flex min-h-11 items-center rounded-md border border-navy/20 px-4 text-sm font-semibold text-navy disabled:opacity-60"
                >
                  {a.articlesUnpublish}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex min-h-11 items-center px-4 text-sm font-semibold text-navy/60"
            >
              {a.articlesCancel}
            </button>
          </div>
        </form>
      )}

      <ul className="mt-10 space-y-4">
        {available && items.length === 0 ? (
          <li className="text-navy/70">{a.articlesEmpty}</li>
        ) : (
          items.map((article) => (
            <li
              key={article.id}
              className="flex flex-col gap-3 border-b border-navy/10 pb-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-navy">{article.title_en}</p>
                <p className="mt-1 text-sm text-navy/55">
                  {article.category} · {article.slug} ·{' '}
                  <span
                    className={cn(
                      'font-semibold',
                      article.status === 'published' ? 'text-teal' : 'text-navy/70',
                    )}
                  >
                    {article.status}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void startEdit(article.id)}
                  className="inline-flex min-h-11 items-center rounded-md border border-navy/20 px-3 text-sm font-semibold text-navy disabled:opacity-60"
                >
                  {a.articlesEdit}
                </button>
                {article.status !== 'published' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onPublish(article.id)}
                    className="inline-flex min-h-11 items-center rounded-md bg-navy px-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {a.articlesPublish}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onUnpublish(article.id)}
                    className="inline-flex min-h-11 items-center rounded-md border border-navy/20 px-3 text-sm font-semibold text-navy disabled:opacity-60"
                  >
                    {a.articlesUnpublish}
                  </button>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
