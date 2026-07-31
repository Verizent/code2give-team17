import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'

export function ComingSoon({
  title,
  body,
}: {
  title: string
  body: string
}) {
  const { t } = useSite()
  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
        <h1 className="font-display text-4xl font-bold text-navy sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-xl leading-relaxed text-ink/85">{body}</p>
        <Link
          to="/"
          className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-card px-5 text-base font-semibold text-navy hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t.nav.home}
        </Link>
      </main>
      <SiteFooter />
    </div>
  )
}
