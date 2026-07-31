'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { STRINGS, type Locale } from '@/lib/strings'

type SiteContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  easyRead: boolean
  setEasyRead: (value: boolean) => void
  t: (typeof STRINGS)[Locale]
}

const SiteContext = createContext<SiteContextValue | null>(null)

const LOCALE_LANG: Record<Locale, string> = {
  en: 'en',
  'zh-Hant': 'zh-Hant',
  'zh-Hans': 'zh-Hans',
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')
  const [easyRead, setEasyRead] = useState(false)

  // Keep the document language in sync for assistive tech and font rendering.
  useEffect(() => {
    document.documentElement.lang = LOCALE_LANG[locale]
  }, [locale])

  useEffect(() => {
    document.documentElement.dataset.easyRead = easyRead ? 'true' : 'false'
  }, [easyRead])

  const value = useMemo<SiteContextValue>(
    () => ({
      locale,
      setLocale,
      easyRead,
      setEasyRead,
      t: STRINGS[locale],
    }),
    [locale, easyRead],
  )

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  const ctx = useContext(SiteContext)
  if (!ctx) {
    throw new Error('useSite must be used within a SiteProvider')
  }
  return ctx
}
