import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandPatternBand } from '@/components/brand-pattern'
import { useSite } from '@/components/site-provider'

const TOAST_MS = 4000

export function StayClose() {
  const { t } = useSite()
  const copy = t.community.stayClose
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  // The form is at the very bottom of a long page, so an inline confirmation can land
  // below the fold on a phone. A toast is visible wherever the viewport happens to be.
  useEffect(() => {
    if (!sent) return undefined
    const id = window.setTimeout(() => setSent(false), TOAST_MS)
    return () => window.clearTimeout(id)
  }, [sent])

  function onSubmit(event) {
    event.preventDefault()
    // DEMO-ONLY: no newsletter API and no list to join — nothing is stored and no
    // email is ever sent. Real version needs a subscribe endpoint and a confirmation
    // step before anyone counts as subscribed.
    setSent(true)
    setEmail('')
  }

  return (
    <>
      <BrandPatternBand variant="yellow" className="easy-hide" />
      <section
        id="stay-close"
        className="relative overflow-hidden bg-navy px-5 py-20 sm:px-10 sm:py-28 lg:px-16"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/brand/hero-group.jpg')" }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-navy/70" />

        <div className="relative mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-[1fr,0.8fr] lg:items-end">
          <div>
            <p className="kicker text-yellow">{copy.eyebrow}</p>
            <h2 className="mt-3 font-display text-[clamp(3rem,6vw,5.5rem)] leading-[0.92] font-semibold text-white">
              {copy.title}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">{copy.body}</p>
          </div>

          <div>
            {/* The form stays put rather than being replaced, so the layout does not
                jump and a second address can be entered. */}
            {(
              <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
                <label className="flex-1">
                  <span className="sr-only">{copy.emailLabel}</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={copy.emailPlaceholder}
                    className="min-h-12 w-full rounded-full border border-white/20 bg-white px-5 text-sm text-navy placeholder:text-navy/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
                  />
                </label>
                <button
                  type="submit"
                  className="min-h-12 rounded-full bg-yellow px-7 text-sm font-bold text-navy transition-colors hover:bg-yellow/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow active:translate-y-px"
                >
                  {copy.subscribe}
                </button>
              </form>
            )}

            {sent &&
              createPortal(
                <div
                  role="status"
                  aria-live="polite"
                  className="fixed inset-x-4 bottom-4 z-[90] mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-navy px-5 py-4 text-white shadow-xl ring-1 ring-white/15 sm:inset-x-auto sm:right-6 sm:bottom-6"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow text-navy"
                  >
                    <Check className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold">{copy.subscribed}</p>
                </div>,
                document.body,
              )}

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/volunteer"
                className="rounded-full border border-white/40 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {copy.volunteer}
              </Link>
              <Link
                to="/give"
                className="rounded-full border border-white/40 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {copy.donate}
              </Link>
              <a
                href="mailto:jeff@love21foundation.com"
                className="rounded-full border border-white/40 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {copy.partner}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
