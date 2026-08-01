import { useEffect, useId, useState } from 'react'
import { Camera, Sparkles, X } from 'lucide-react'
import { useSite } from '@/components/site-provider'
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
  const { t } = useSite()
  const titleId = useId()
  const [line, setLine] = useState('')
  const [hasPhoto, setHasPhoto] = useState(false)
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

  const showDraft = line.trim().length > 8

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/45 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-paper shadow-xl"
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
          <div>
            <p className="kicker text-teal">{t.community.sharePhoto}</p>
            <button
              type="button"
              onClick={() => setHasPhoto(true)}
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
            <span className="kicker text-teal">{t.community.shareLine}</span>
            <input
              type="text"
              value={line}
              onChange={(e) => setLine(e.target.value)}
              placeholder={t.community.shareLinePlaceholder}
              className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          {showDraft && (
            <div className="rounded-xl border border-yellow/40 bg-yellow/15 p-4">
              <p className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-navy/70 uppercase">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {t.community.shareAiLabel}
              </p>
              <p className="mt-2 text-base leading-relaxed text-ink/90">
                <span className="font-semibold text-navy">{line.trim()}. </span>
                {t.community.shareAiDraft}
              </p>
            </div>
          )}

          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-ink/75">
            {t.community.shareReviewNote}
          </p>

          {sent ? (
            <p className="font-medium text-teal">{t.community.shareSent}</p>
          ) : (
            <button
              type="button"
              disabled={!hasPhoto || line.trim().length < 4}
              onClick={() => setSent(true)}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-navy px-5 text-base font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t.community.shareSubmit}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
