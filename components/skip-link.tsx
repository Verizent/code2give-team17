'use client'

import { useSite } from '@/components/site-provider'

export function SkipLink() {
  const { t } = useSite()
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
    >
      {t.nav.skipToContent}
    </a>
  )
}
