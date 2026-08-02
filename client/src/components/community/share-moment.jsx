import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, X } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { useAuth } from '@/features/auth/AuthProvider'
import { ACTIVITY_TYPES, RELATIONSHIP_OPTIONS } from '@/lib/mock'
import { submitVoice, uploadCommunityPhoto } from '@/features/content/api'
import { cn } from '@/lib/utils'

// Matches MIN_STORY_LENGTH in server/src/schemas/community-post.schema.js —
// enforced here too so mock and real mode behave the same.
const MIN_STORY_LENGTH = 40
// Loose check only — empty is allowed (contact_email is optional on the API).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Mirrors MAX_UPLOAD_BYTES in the media service and the bucket's file_size_limit.
const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function ShareMomentButton({ className }) {
  const { t } = useSite()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-red px-6 text-base font-semibold text-white sm:w-auto sm:min-h-[52px] sm:rounded-xl sm:px-7',
          className,
        )}
      >
        <Camera className="h-5 w-5" aria-hidden="true" />
        {t.community.shareCta}
      </button>
      {open && (
        <ShareMomentDialog
          onClose={() => {
            setOpen(false)
            // Send focus back where it came from; otherwise it falls to <body> and a
            // keyboard user restarts from the top of the page.
            triggerRef.current?.focus()
          }}
        />
      )}
    </>
  )
}

function ShareMomentDialog({ onClose }) {
  const { t } = useSite()
  const { user } = useAuth()
  const titleId = useId()
  const panelRef = useRef(null)
  const fileInputRef = useRef(null)

  // Signed in is a convenience, never a requirement: anyone may post under any name,
  // and the moderation queue is what gates publication.
  const [authorName, setAuthorName] = useState(
    () => user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '',
  )
  const [contactEmail, setContactEmail] = useState('')
  const [line, setLine] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoError, setPhotoError] = useState(null)
  const [relationship, setRelationship] = useState(RELATIONSHIP_OPTIONS[0])
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0])
  const [consent, setConsent] = useState(false)
  // Honeypot for POST /api/community-posts — real users never see or fill this.
  const [website, setWebsite] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      // Focus trap: without this, Tab walks out of the dialog and into the page
      // behind it, which is still visible but inert.
      const panel = panelRef.current
      const focusable = panel?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      // Focus can end up outside the panel — on <body> after an element is removed, or
      // on the page behind. Neither edge branch would match, so Tab would walk out.
      if (!panel.contains(document.activeElement)) {
        e.preventDefault()
        first.focus()
        return
      }

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    // Focus the panel itself rather than the first field, so a screen reader announces
    // the dialog title and hint before the visitor is dropped into an input.
    panelRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Object URLs are leaked memory until revoked, and a new one is minted per pick.
  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null)
      return undefined
    }
    const url = URL.createObjectURL(photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const emailTrimmed = contactEmail.trim()
  const emailOk = emailTrimmed === '' || EMAIL_RE.test(emailTrimmed)
  const storyReady = line.trim().length >= MIN_STORY_LENGTH
  const canSubmit =
    consent && storyReady && authorName.trim().length > 0 && emailOk && !submitting

  function handlePickPhoto(event) {
    const file = event.target.files?.[0]
    setPhotoError(null)
    if (!file) {
      setPhoto(null)
      return
    }
    // Checked here so the visitor is told immediately rather than after a 5MB upload
    // round-trip. The server re-checks both — this is convenience, not the boundary.
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setPhotoError(t.community.sharePhotoWrongType)
      setPhoto(null)
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(t.community.sharePhotoTooLarge)
      setPhoto(null)
      return
    }
    setPhoto(file)
  }

  function clearPhoto() {
    setPhoto(null)
    setPhotoError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return

    setError(null)
    setSubmitting(true)
    try {
      // Upload only once the rest of the form is valid, so a rejected submission never
      // leaves an orphaned image in the bucket.
      let photoUrl = null
      if (photo) {
        try {
          photoUrl = await uploadCommunityPhoto(photo)
        } catch (uploadError) {
          console.error('uploadCommunityPhoto failed', uploadError)
          setError(t.community.sharePhotoFailed)
          return
        }
      }

      await submitVoice({
        authorName: authorName.trim(),
        relationship,
        activityType,
        story: line.trim(),
        contactEmail: emailTrimmed || undefined,
        photoUrl,
        website,
      })
      setSent(true)
    } catch (err) {
      console.error('submitVoice failed', err)
      setError(t.community.shareError)
    } finally {
      setSubmitting(false)
    }
  }

  // Portal to <body> — this dialog must escape the page's own stacking/layout
  // context (e.g. the hero's `relative` wrapper) so `fixed` truly means the
  // real viewport, and it renders above the sticky header regardless of
  // where <ShareMomentButton /> happens to be mounted in the tree.
  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/45 sm:items-center sm:p-4"
      // Closing on pointerdown rather than click means a drag that starts inside the
      // panel and ends on the backdrop (easy on a phone) does not discard the form.
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        ref={panelRef}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // Focusable only programmatically — the panel is the initial focus target but
        // must not become a Tab stop of its own.
        tabIndex={-1}
        // Flex column with a scrolling body: a single scroll container sized to the
        // viewport puts the submit button under the on-screen keyboard on a phone.
        className="flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl border border-border bg-paper shadow-xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="font-display text-2xl font-bold text-navy">
              {t.community.shareTitle}
            </h2>
            <p className="mt-1 text-sm text-ink/75">{t.community.shareHint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.community.shareClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <label className="block">
            <span className="kicker text-teal">{t.community.shareAuthorLabel}</span>
            <input
              type="text"
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder={t.community.shareAuthorPlaceholder}
              autoComplete="name"
              enterKeyHint="next"
              className="mt-2 min-h-[44px] w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="block">
            <span className="kicker text-teal">{t.community.shareEmailLabel}</span>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder={t.community.shareEmailPlaceholder}
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
              className="mt-2 min-h-[44px] w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {!emailOk && (
              <span role="alert" className="mt-1.5 block text-xs text-red">
                {t.community.shareEmailInvalid}
              </span>
            )}
          </label>

          <label className="block">
            <span className="kicker text-teal">{t.community.shareLine}</span>
            <textarea
              required
              value={line}
              onChange={(e) => setLine(e.target.value)}
              placeholder={t.community.shareLinePlaceholder}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className={cn('mt-1.5 block text-xs', storyReady ? 'text-ink/50' : 'text-red')}>
              {t.community.shareLengthHint
                .replace('{min}', MIN_STORY_LENGTH)
                .replace('{n}', line.trim().length)}
            </span>
          </label>

          <div>
            <p className="kicker text-teal">{t.community.sharePhoto}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handlePickPhoto}
              className="sr-only"
              id={`${titleId}-photo`}
            />
            {photoPreview ? (
              <div className="mt-2">
                <img
                  src={photoPreview}
                  alt={t.community.sharePhotoAttached}
                  className="h-40 w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="mt-2 min-h-[44px] text-sm font-semibold text-red underline"
                >
                  {t.community.sharePhotoRemove}
                </button>
              </div>
            ) : (
              <label
                htmlFor={`${titleId}-photo`}
                className="mt-2 flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card text-navy/60 transition-colors hover:bg-muted"
              >
                <Camera className="h-7 w-7" aria-hidden="true" />
                <span className="text-sm font-medium">{t.community.sharePhotoAdd}</span>
              </label>
            )}
            {photoError && (
              <p role="alert" className="mt-2 text-sm font-medium text-red">
                {photoError}
              </p>
            )}
          </div>

          {/* The tag on the finished card, and the tab it will be filed under. Without
              this a submission can never appear under any filter. */}
          <label className="block">
            <span className="kicker text-teal">{t.community.shareActivityLabel}</span>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="mt-2 min-h-[44px] w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ACTIVITY_TYPES.map((id) => (
                <option key={id} value={id}>
                  {t.community.filters[id]}
                </option>
              ))}
            </select>
            <span className="mt-1.5 block text-xs text-ink/50">
              {t.community.shareActivityHint}
            </span>
          </label>

          <label className="block">
            <span className="kicker text-teal">{t.community.shareRelationshipLabel}</span>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="mt-2 min-h-[44px] w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {RELATIONSHIP_OPTIONS.map((id) => (
                <option key={id} value={id}>
                  {t.community.relationships[id]}
                </option>
              ))}
            </select>
          </label>

          {/* Honeypot — visually hidden, never focusable by a keyboard/screen-reader user. */}
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
          />

          <label className="flex items-start gap-3 text-sm text-ink/85">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-border text-teal focus-visible:ring-2 focus-visible:ring-ring"
            />
            {t.community.shareConsent}
          </label>

          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-ink/75">
            {t.community.shareReviewNote}
          </p>
        </div>

        {/* Outside the scroll area so it stays reachable when the keyboard is open. */}
        <div className="border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {error && (
            <p role="alert" className="mb-3 text-sm font-medium text-red">
              {error}
            </p>
          )}
          {sent ? (
            <p role="status" className="font-medium text-teal">
              {t.community.shareSent}
            </p>
          ) : (
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-navy px-5 text-base font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting && photo ? t.community.sharePhotoUploading : t.community.shareSubmit}
            </button>
          )}
        </div>
      </form>
    </div>,
    document.body,
  )
}
