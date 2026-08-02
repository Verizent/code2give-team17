import { Link } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SkipLink } from '@/components/skip-link'
import { useSite } from '@/components/site-provider'
import { MEMBER_LOGIN_URL } from '@/lib/member-portal'

// Real Love 21 destinations — form is their live family/registration intake;
// MEMBER_LOGIN_URL is the real family portal where classes/schedules live.
const SUPPORT_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScxXfbxdMlHBDphqwJhMZS1YuUuF9anGC8Mb_ncgpwiEes-Pw/viewform'
const SUPPORT_EMAIL = 'info@love21foundation.com'

export function SupportPage() {
  const { t } = useSite()
  const s = t.support

  return (
    <div className="min-h-screen bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="mx-auto max-w-xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="kicker text-teal">{s.eyebrow}</p>
        <h1 className="mt-3 font-display text-[clamp(1.75rem,5vw,2.5rem)] font-semibold text-navy">
          {s.title}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-navy/80 sm:text-base">{s.intro}</p>

        <div className="mt-10 rounded-xl border border-black/8 bg-white p-5 sm:p-6">
          <p className="font-display text-lg font-semibold text-navy">{s.processTitle}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-navy/70">{s.processBody}</p>
          <a
            href={SUPPORT_FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-md bg-red px-5 text-[14px] font-semibold text-white shadow-sm hover:bg-red/90"
          >
            {s.formCta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-3 flex min-h-[44px] items-center gap-1.5 text-[13px] font-medium text-navy/60 underline-offset-4 hover:text-navy hover:underline"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {s.emailNote}
          </a>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 text-[14px]">
          <span className="text-navy/60">{s.memberNote}</span>
          <a
            href={MEMBER_LOGIN_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-teal underline-offset-4 hover:underline"
          >
            {s.memberCta}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <Link
          to="/"
          className="mt-12 inline-block text-[14px] font-semibold text-navy underline-offset-4 hover:underline"
        >
          ← {s.backHome}
        </Link>
      </main>
      <SiteFooter />
    </div>
  )
}
