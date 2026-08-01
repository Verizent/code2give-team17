import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'

export function AdminPage() {
  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="kicker text-red">Staff</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-navy sm:text-5xl">
          Admin Studio
        </h1>
        <p className="section-lede mt-4 max-w-2xl text-lg text-navy/75">
          Approve once → fan-out to Home, Community, stats, and social drafts. Shell only for now.
        </p>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              title: 'Proof queue',
              body: 'Consent state · blur unconsented · Approve fans out.',
            },
            {
              title: 'Sessions',
              body: 'Bulk attendance · recruiting flags for the Home rail.',
            },
            {
              title: 'Funnel',
              body: 'Visitor → volunteer → donor. Colour + label, not colour alone.',
            },
          ].map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-border bg-white p-6"
            >
              <h2 className="font-display text-xl font-semibold text-navy">{card.title}</h2>
              <p className="mt-3 text-navy/70">{card.body}</p>
              <p className="mt-6 text-sm font-bold text-red">Shell · not live yet</p>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
