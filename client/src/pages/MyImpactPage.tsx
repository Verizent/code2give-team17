import { Link } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'

export function MyImpactPage() {
  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="kicker text-red">Stay involved</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-navy sm:text-6xl">
          Your giving
        </h1>
        <p className="section-lede mt-5 max-w-xl text-xl text-navy/80">
          What did your gift become? Proof receipts land here when a funded class happens.
        </p>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl bg-amber">
            <img
              src="/brand/hero-group.jpg"
              alt=""
              className="aspect-[4/3] w-full object-cover opacity-95"
            />
            <div className="absolute bottom-4 left-4 rounded-xl bg-yellow px-4 py-3 text-navy">
              <p className="font-display text-3xl font-semibold">0</p>
              <p className="text-sm font-medium">sessions on your garden</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-navy">Proof receipts</h2>
            <p className="mt-3 text-base text-navy/70">
              Empty for now — after you give, specific class receipts appear here.
            </p>
            <Link
              to="/give"
              className="mt-8 inline-flex min-h-[48px] items-center rounded-md bg-red px-6 text-[15px] font-semibold text-white"
            >
              Give first →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
