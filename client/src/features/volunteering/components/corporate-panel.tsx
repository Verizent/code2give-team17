import { useState, type FormEvent } from 'react'
import { useSite } from '@/components/site-provider'

export function CorporatePanel() {
  const { t } = useSite()
  const v = t.volunteer
  const [sent, setSent] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSent(true)
  }

  const fieldClass =
    'mt-1.5 min-h-12 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10'

  return (
    <section className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
      <div>
        <img
          src="/brand/hero-group.jpg"
          alt=""
          className="aspect-[4/3] w-full rounded-2xl object-cover"
        />
        <h2 className="mt-7 font-display text-3xl font-semibold text-navy">
          {v.corporatePanelTitle}
        </h2>
        <ul className="mt-5 space-y-3">
          {v.corporateBullets.map((bullet) => (
            <li key={bullet} className="flex gap-3 text-navy/75">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-yellow" aria-hidden />
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-amber p-6 sm:p-8">
        <p className="text-xs font-bold tracking-wide text-teal uppercase">Demo-only</p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-navy">
          {v.corporateFormTitle}
        </h3>
        {sent ? (
          <p className="mt-6 rounded-xl bg-white p-5 font-semibold text-teal" role="status">
            {v.corporateThanks}
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-navy">
              {v.corporateOrg}
              <input name="organisation" required className={fieldClass} />
            </label>
            <label className="block text-sm font-semibold text-navy">
              {v.corporateContact}
              <input name="contact" required className={fieldClass} />
            </label>
            <label className="block text-sm font-semibold text-navy">
              {v.corporateEmail}
              <input name="email" type="email" required className={fieldClass} />
            </label>
            <label className="block text-sm font-semibold text-navy">
              {v.corporateMessage}
              <textarea name="message" rows={4} className={fieldClass} />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-navy px-6 font-bold text-white hover:bg-navy/90 sm:w-auto"
            >
              {v.corporateSubmit}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
