import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSite } from '@/components/site-provider'
import { BrandLogo } from '@/components/brand-logo'
import { LOCALES, type Locale } from '@/lib/strings'

function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useSite()
  const codes = LOCALES.filter((l) => l.code === 'en' || l.code === 'zh-Hant')
  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={cn('inline-flex items-center gap-1 text-[15px] font-medium text-navy', className)}
    >
      {codes.map((l, i) => {
        const active = l.code === locale || (locale === 'zh-Hans' && l.code === 'zh-Hant')
        return (
          <span key={l.code} className="inline-flex items-center gap-1">
            {i > 0 && (
              <span className="text-navy/35" aria-hidden>
                |
              </span>
            )}
            <button
              type="button"
              onClick={() => setLocale(l.code as Locale)}
              aria-pressed={active}
              className={cn(
                'min-h-[44px] px-1',
                active ? 'font-semibold text-navy' : 'text-navy/55 hover:text-navy',
              )}
            >
              {l.short === 'EN' ? 'EN' : '繁'}
            </button>
          </span>
        )
      })}
    </div>
  )
}

function EasyReadToggle({ compact = false }: { compact?: boolean }) {
  const { easyRead, setEasyRead, t } = useSite()
  return (
    <button
      type="button"
      onClick={() => setEasyRead(!easyRead)}
      aria-pressed={easyRead}
      title={t.nav.easyRead}
      className={cn(
        'header-compact inline-flex min-h-[44px] items-center justify-center rounded-md border-2 font-bold transition-colors',
        compact ? 'min-w-[44px] px-2 text-sm' : 'gap-1.5 px-3 text-sm',
        easyRead
          ? 'border-navy bg-yellow text-navy shadow-sm'
          : 'border-navy/20 bg-white text-navy hover:border-navy/40',
      )}
    >
      {compact ? (
        <span aria-hidden="true">A{easyRead ? '+' : ''}</span>
      ) : (
        <>
          <span aria-hidden="true" className="text-base leading-none">
            {easyRead ? 'A+' : 'A'}
          </span>
          {t.nav.easyRead}
        </>
      )}
      <span className="sr-only">{easyRead ? 'on' : 'off'}</span>
    </button>
  )
}

export function SiteHeader() {
  const { t, easyRead, setEasyRead } = useSite()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const navItems = [
    { href: '/', label: t.nav.home },
    { href: '/community', label: t.nav.community },
    { href: '/volunteer', label: t.nav.volunteer },
    { href: '/give', label: t.nav.give },
  ]

  return (
    <>
      {easyRead && (
        <div
          role="status"
          className="border-b border-navy/10 bg-yellow px-4 py-2 text-center text-sm font-bold text-navy sm:text-base"
        >
          Easy Read is on — larger text, clearer buttons.{' '}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => setEasyRead(false)}
          >
            Turn off
          </button>
        </div>
      )}
      <header className="site-header sticky top-0 z-50 border-b border-black/5 bg-white">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-3 px-4 sm:h-[72px] sm:gap-6 sm:px-8">
          <Link to="/" className="min-w-0 shrink-0" aria-label="Love 21 home">
            <BrandLogo markClassName="h-8 w-auto sm:h-10" />
          </Link>

          <nav
            aria-label="Primary"
            className="ml-auto hidden items-center gap-5 lg:flex xl:gap-6"
          >
            {navItems.map((item) => {
              const active =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'relative flex min-h-[44px] items-center text-[15px] font-medium text-navy',
                    active &&
                      'after:absolute after:right-0 after:bottom-2 after:left-0 after:h-0.5 after:bg-red',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
            <LanguageSwitch />
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/support"
              className="min-h-[44px] px-1 text-[13px] font-medium text-navy/55 underline-offset-4 hover:text-navy hover:underline"
            >
              {t.nav.askForHelp}
            </Link>
            <EasyReadToggle />
            <Link
              to="/volunteer"
              className="inline-flex h-10 items-center rounded-md border border-red px-4 text-[14px] font-semibold text-red hover:bg-red/5 xl:px-5"
            >
              {t.nav.volunteer}
            </Link>
            <Link
              to="/give"
              className="inline-flex h-10 items-center rounded-md bg-red px-4 text-[14px] font-bold text-white shadow-sm hover:bg-red/90 xl:px-5"
            >
              {t.nav.donate}
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 lg:hidden">
            <EasyReadToggle compact />
            <Link
              to="/give"
              className="header-compact inline-flex h-9 items-center rounded-md bg-red px-2.5 text-[13px] font-semibold text-white sm:h-10 sm:px-3 sm:text-sm"
            >
              {t.nav.donate}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="header-compact flex h-9 w-9 items-center justify-center rounded-md border border-navy/15 text-navy sm:h-10 sm:w-10"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div
            id="mobile-menu"
            className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-black/5 bg-white lg:hidden"
          >
            <nav className="flex flex-col px-4 py-3 sm:px-5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[48px] items-center border-b border-black/5 text-base font-medium text-navy"
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex min-h-[48px] items-center border-b border-black/5">
                <LanguageSwitch />
              </div>
              <Link
                to="/support"
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center border-b border-black/5 text-[14px] font-medium text-navy/55"
              >
                {t.nav.askForHelp}
              </Link>
              <Link
                to="/volunteer"
                onClick={() => setOpen(false)}
                className="mt-3 flex min-h-[48px] items-center justify-center rounded-md border border-red font-semibold text-red"
              >
                {t.nav.volunteer}
              </Link>
              <Link
                to="/give"
                onClick={() => setOpen(false)}
                className="mt-2 flex min-h-[48px] items-center justify-center rounded-md bg-red font-semibold text-white"
              >
                {t.nav.donate}
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
