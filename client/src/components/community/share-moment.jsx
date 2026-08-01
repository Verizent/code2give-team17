import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, X } from 'lucide-react'
import { useSite } from '@/components/site-provider'
import { ACTIVITY_TYPES, DEMO_SIGNED_IN_PROFILE } from '@/lib/mock'
import { cn } from '@/lib/utils'

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
  const [line, setLine] = useState('')
  const [hasPhoto, setHasPhoto] = useState(false)
  const [type, setType] = useState(ACTIVITY_TYPES[0])
  const [consent, setConsent] = useState(false)
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
          <p className="text-sm text-ink/70">
            {t.community.shareAsLabel}{' '}
            <span className="font-semibold text-navy">{DEMO_SIGNED_IN_PROFILE.name[locale]}</span>
          </p>

          <label className="block">
            <span className="kicker text-teal">{t.community.shareLine}</span>
            <textarea
              value={line}
              onChange={(e) => setLine(e.target.value)}
              placeholder={t.community.shareLinePlaceholder}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
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
                {hasPhoto ? 'Photo attached (preview)' : 'Add a photo'}
              </span>
            </button>
          </div>

          <label className="block">
            <span className="kicker text-teal">{t.community.shareTagLabel}</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ACTIVITY_TYPES.map((id) => (
                <option key={id} value={id}>
                  {t.community.filters[id]}
                </option>
              ))}
            </select>
          </label>

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

          {sent ? (
            <p className="font-medium text-teal">{t.community.shareSent}</p>
          ) : (
            <button
              type="button"
              disabled={!consent || line.trim().length < 4}
              onClick={() => setSent(true)}
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
