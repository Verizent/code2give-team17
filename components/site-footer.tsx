'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useSite } from '@/components/site-provider'

export function SiteFooter() {
  const { t } = useSite()

  const socials = [
    { href: '#', label: 'Instagram' },
    { href: '#', label: 'Facebook' },
    { href: '#', label: 'YouTube' },
  ]

  return (
    <footer className="mt-24 bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red text-white">
                <Heart className="h-5 w-5" fill="currentColor" aria-hidden="true" />
              </span>
              <span className="font-display text-lg font-bold text-white">
                Love 21 Foundation
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              {t.footer.tax}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Link
              href="/portal"
              className="inline-flex min-h-[44px] items-center text-base font-medium text-white hover:underline"
            >
              {t.footer.portal}
            </Link>
            <Link
              href="/support"
              className="inline-flex min-h-[44px] items-center text-base font-medium text-white/80 hover:text-white hover:underline"
            >
              {t.footer.support}
            </Link>
          </div>

          <div>
            <p className="text-sm font-semibold tracking-wide text-white/70 uppercase">
              {t.footer.followUs}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {socials.map(({ href, label }) => (
                <Link
                  key={label}
                  href={href}
                  className="inline-flex min-h-[44px] items-center text-base font-medium text-white/80 transition-colors hover:text-white hover:underline"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/15 pt-6 text-sm text-white/60">
          © {new Date().getFullYear()} Love 21 Foundation. {t.footer.rights}
        </div>
      </div>
    </footer>
  )
}
