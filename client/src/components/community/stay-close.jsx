import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandPatternBand } from '@/components/brand-pattern'
import { useSite } from '@/components/site-provider'

export function StayClose() {
  const { t } = useSite()
  const copy = t.community.stayClose
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function onSubmit(event) {
    event.preventDefault()
    // DEMO-ONLY: no newsletter API yet — acknowledge locally only.
    setSent(true)
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
            {sent ? (
              <p role="status" className="min-h-12 text-base font-semibold text-yellow">
                {copy.subscribed}
              </p>
            ) : (
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
