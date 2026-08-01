import { createContext, useContext, useEffect, useState } from 'react'
import { getStrings } from '@/lib/strings'

const SiteContext = createContext(null)

const LOCALE_LANG = {
  en: 'en',
  'zh-Hant': 'zh-Hant',
  'zh-Hans': 'zh-Hans',
}

function readStoredEasyRead() {
  const next = localStorage.getItem('love21-easy-read')
  if (next === 'true' || next === 'false') return next === 'true'
  // migrate mistaken “reading mode” key if present
  return localStorage.getItem('love21-reading-mode') === 'true'
}

export function SiteProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    const saved = localStorage.getItem('love21-locale')
    if (saved === 'en' || saved === 'zh-Hant' || saved === 'zh-Hans') return saved
    return 'en'
  })
  const [easyRead, setEasyReadState] = useState(readStoredEasyRead)

  function setEasyRead(value) {
    setEasyReadState(value)
    localStorage.setItem('love21-easy-read', String(value))
    localStorage.removeItem('love21-reading-mode')
  }

  useEffect(() => {
    document.documentElement.lang = LOCALE_LANG[locale]
    localStorage.setItem('love21-locale', locale)
  }, [locale])

  useEffect(() => {
    document.documentElement.dataset.easyRead = easyRead ? 'true' : 'false'
  }, [easyRead])

  const value = {
    locale,
    setLocale,
    easyRead,
    setEasyRead,
    t: getStrings(locale, easyRead),
  }

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  const ctx = useContext(SiteContext)
  if (!ctx) {
    throw new Error('useSite must be used within a SiteProvider')
  }
  return ctx
}
