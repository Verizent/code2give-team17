import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Heart, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSite } from '@/components/site-provider'
import { LOCALES, type Locale } from '@/lib/strings'

function LanguageSwitch() {
  const { locale, setLocale, t } = useSite()
  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className="inline-flex items-center rounded-lg border border-border bg-card p-0.5"
    >
      {LOCALES.map((l) => {
        const active = l.code === locale
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLocale(l.code as Locale)}
            aria-pressed={active}
            className={cn(
              'min-h-[36px] min-w-[36px] rounded-md px-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-navy text-white'
                : 'text-ink/70 hover:bg-muted hover:text-ink',
            )}
          >
            {l.short}
          </button>
        )
      })}
    </div>
  )
}

function EasyReadToggle() {
  const { easyRead, setEasyRead, t } = useSite()
  return (
    <button
      type="button"
      onClick={() => setEasyRead(!easyRead)}
      aria-pressed={easyRead}
      className={cn(
        'inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
        easyRead
          ? 'border-teal bg-teal text-white'
          : 'border-border bg-card text-ink hover:bg-muted',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex h-4 w-7 items-center rounded-full p-0.5 transition-colors',
          easyRead ? 'bg-white/40' : 'bg-ink/20',
        )}
      >
        <span
          className={cn(
            'h-3 w-3 rounded-full bg-white transition-transform',
            easyRead && 'translate-x-3',
          )}
        />
      </span>
      {t.nav.easyRead}
    </button>
  )
}

export function SiteHeader() {
  const { t } = useSite()
  const [open, setOpen] = useState(false)

  const navItems = [
    { href: '/', label: t.nav.home },
    { href: '/community', label: t.nav.community },
    { href: '/volunteer', label: t.nav.volunteer },
    { href: '/give', label: t.nav.give },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red text-white">
            <Heart className="h-5 w-5" fill="currentColor" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold leading-tight text-navy">
            Love 21
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 lg:flex"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex min-h-[44px] items-center rounded-lg px-3 text-base font-medium text-ink transition-colors hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right controls */}
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitch />
          <EasyReadToggle />
          <Link
            to="/give"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-red px-5 text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-red/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Heart className="h-4 w-4" fill="currentColor" aria-hidden="true" />
            {t.nav.donate}
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            to="/give"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-red px-4 text-sm font-semibold text-white"
          >
            <Heart className="h-4 w-4" fill="currentColor" aria-hidden="true" />
            {t.nav.donate}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Menu"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-navy"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t border-border bg-paper lg:hidden"
        >
          <nav
            aria-label="Primary"
            className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg px-3 text-base font-medium text-ink hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <LanguageSwitch />
              <EasyReadToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
