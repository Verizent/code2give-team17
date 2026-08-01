import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, X } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { DEMO_SIGNED_IN_PROFILE, RELATIONSHIP_OPTIONS } from '@/lib/mock'
import { submitVoice } from '@/features/content/api'
import { cn } from '@/lib/utils'

// Matches MIN_STORY_LENGTH in server/src/schemas/community-post.schema.js —
// enforced here too so mock and real mode behave the same.
const MIN_STORY_LENGTH = 40

export function ShareMomentButton({ className }) {
  const { t } = useSite()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
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
      {open && <ShareMomentDialog onClose={() => setOpen(false)} />}
    </>
  )
}

function ShareMomentDialog({ onClose }) {
  const { locale, t } = useSite()
  const titleId = useId()
  const [authorName, setAuthorName] = useState(DEMO_SIGNED_IN_PROFILE.name[locale])
  const [line, setLine] = useState('')
  const [hasPhoto, setHasPhoto] = useState(false)
  const [relationship, setRelationship] = useState(RELATIONSHIP_OPTIONS[0])
  const [consent, setConsent] = useState(false)
  // Honeypot for POST /api/community-posts — real users never see or fill this.
  const [website, setWebsite] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const storyReady = line.trim().length >= MIN_STORY_LENGTH
  const canSubmit = consent && storyReady && authorName.trim().length > 0 && !submitting

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      await submitVoice({ authorName: authorName.trim(), relationship, story: line.trim(), website })
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
      className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/45 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
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
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <label className="block">
            <span className="kicker text-teal">{t.community.shareAuthorLabel}</span>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder={t.community.shareAuthorPlaceholder}
              className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="block">
            <span className="kicker text-teal">{t.community.shareLine}</span>
            <textarea
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
            <button
              type="button"
              onClick={() => setHasPhoto((v) => !v)}
              className={cn(
                'mt-2 flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors',
                hasPhoto
                  ? 'border-teal bg-teal/10 text-teal'
                  : 'border-border bg-card text-navy/60 hover:bg-muted',
              )}
            >
              <Camera className="h-7 w-7" aria-hidden="true" />
              <span className="text-sm font-medium">
                {hasPhoto ? t.community.sharePhotoAttached : t.community.sharePhotoAdd}
              </span>
            </button>
          </div>

          <label className="block">
            <span className="kicker text-teal">{t.community.shareRelationshipLabel}</span>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            className="absolute h-0 w-0 overflow-hidden opacity-0"
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

          {error && <p className="text-sm font-medium text-red">{error}</p>}

          {sent ? (
            <p className="font-medium text-teal">{t.community.shareSent}</p>
          ) : (
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-navy px-5 text-base font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t.community.shareSubmit}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
