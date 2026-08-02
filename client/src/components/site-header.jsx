import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSite } from '@/components/site-provider'
import { BrandLogo } from '@/components/brand-logo'
import { useAuth } from '@/features/auth/AuthProvider'
import { fetchAuthMe } from '@/features/auth/api'
import { LOCALES } from '@/lib/strings'

const NAV_LINK =
  'relative inline-flex h-10 items-center whitespace-nowrap text-[15px] font-medium text-navy transition-colors hover:text-navy/70'

const ACCOUNT_LINK =
  'inline-flex h-10 items-center px-1 text-[14px] font-semibold text-navy hover:text-navy/70'

/**
 * Each page mounts its own SiteHeader, so role must survive remounts — otherwise
 * admins flash "My impact" (default false) on every navigation until /api/auth/me returns.
 */
let cachedAccountRole = null

function readCachedRole(userId) {
  if (!userId) return 'pending'
  if (cachedAccountRole?.userId === userId) return cachedAccountRole.role
  return 'pending'
}

function LanguageSwitch({ className }) {
  const { locale, setLocale, t } = useSite()
  const codes = LOCALES.filter((l) => l.code === 'en' || l.code === 'zh-Hant')
  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={cn('inline-flex h-10 items-center gap-0.5 text-[14px] font-medium', className)}
    >
      {codes.map((l, i) => {
        const active = l.code === locale || (locale === 'zh-Hans' && l.code === 'zh-Hant')
        return (
          <span key={l.code} className="inline-flex items-center gap-0.5">
            {i > 0 && (
              <span className="px-0.5 text-navy/30" aria-hidden>
                |
              </span>
            )}
            <button
              type="button"
              onClick={() => setLocale(l.code)}
              aria-pressed={active}
              className={cn(
                'inline-flex h-10 items-center px-1',
                active ? 'font-semibold text-navy' : 'text-navy/50 hover:text-navy',
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

/** Easy Read lightswitch — excluded from Easy Read min-height stretch. */
function EasyReadToggle() {
  const { easyRead, setEasyRead, t } = useSite()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={easyRead}
      onClick={() => setEasyRead(!easyRead)}
      className="easy-read-switch inline-flex h-10 items-center gap-2"
    >
      <span
        className={cn(
          'whitespace-nowrap text-[14px] font-medium',
          easyRead ? 'font-semibold text-navy' : 'text-navy/50',
        )}
      >
        {t.nav.easyRead}
      </span>
      <span
        aria-hidden
        className={cn(
          'relative block h-5 w-9 shrink-0 rounded-full transition-colors duration-200',
          easyRead ? 'bg-teal' : 'bg-navy/20',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
            easyRead && 'translate-x-4',
          )}
        />
      </span>
    </button>
  )
}

export function SiteHeader() {
  const { t, easyRead, setEasyRead } = useSite()
  const auth = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const userId = auth.user?.id
  const [accountRole, setAccountRole] = useState(() => readCachedRole(userId))

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!auth.ready) return

    if (!auth.accessToken || !userId) {
      cachedAccountRole = null
      setAccountRole('pending')
      return
    }

    const id = userId
    const cached = readCachedRole(id)
    // Keep last known role while refetching (token refresh / remount) — no My Impact flash.
    if (cached !== 'pending') setAccountRole(cached)

    let cancelled = false
    void fetchAuthMe()
      .then((me) => {
        if (cancelled) return
        const role =
          String(me.role ?? '')
            .trim()
            .toLowerCase() === 'admin'
            ? 'admin'
            : 'member'
        cachedAccountRole = { userId: id, role }
        setAccountRole(role)
      })
      .catch(() => {
        if (cancelled) return
        // Transient failure: keep cache; only fall back when role is still unknown.
        if (readCachedRole(id) === 'pending') setAccountRole('member')
      })
    return () => {
      cancelled = true
    }
  }, [auth.ready, auth.accessToken, userId])

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

  /** Order: Home · Community · Volunteer · Give */
  const primaryNav = [
    { href: '/', label: t.nav.home },
    { href: '/community', label: t.nav.community },
    { href: '/volunteer', label: t.nav.volunteer },
    { href: '/give', label: t.nav.give },
  ]

  // Wait for auth + role before choosing label/href so they never disagree or flash wrong.
  const accountLoading = !auth.ready || (Boolean(auth.user) && accountRole === 'pending')
  const account = accountLoading
    ? null
    : !auth.user
      ? { href: '/login', label: t.nav.login }
      : accountRole === 'admin'
        ? { href: '/admin', label: t.nav.admin }
        : { href: '/me', label: t.nav.myImpact }

  function navActive(href) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <>
      {easyRead && (
        <div
          role="status"
          className="border-b border-navy/10 bg-yellow px-4 py-2 text-center text-sm font-bold text-navy"
        >
          {t.nav.easyReadBanner}{' '}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => setEasyRead(false)}
          >
            {t.nav.easyReadTurnOff}
          </button>
        </div>
      )}

      <header className="site-header sticky top-0 z-50 border-b border-black/5 bg-white">
        <div className="mx-auto grid h-14 max-w-[1120px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-4 sm:h-16 sm:gap-x-5 sm:px-8 lg:gap-x-6">
          {/* Brand */}
          <Link to="/" className="shrink-0" aria-label="Love 21 home">
            <BrandLogo markClassName="h-8 w-auto sm:h-9" />
          </Link>

          {/* Primary nav — desktop */}
          <nav
            aria-label="Primary"
            className="hidden min-w-0 items-center justify-start gap-4 lg:flex xl:gap-5"
          >
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  NAV_LINK,
                  navActive(item.href) &&
                    'font-semibold after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-red',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions — desktop: utilities · account · Volunteer + Donate */}
          <div className="hidden min-w-0 items-center gap-3 lg:flex xl:gap-4">
            <div className="flex items-center gap-2.5 xl:gap-3">
              <LanguageSwitch />
              <EasyReadToggle />
            </div>
            <div className="flex shrink-0 items-center gap-2 border-l border-navy/10 pl-3 xl:gap-2.5 xl:pl-4">
              {account ? (
                <Link to={account.href} className={ACCOUNT_LINK}>
                  {account.label}
                </Link>
              ) : (
                <span
                  className={cn(ACCOUNT_LINK, 'min-w-[4.5rem] cursor-default text-navy/25')}
                  aria-busy="true"
                >
                  …
                </span>
              )}
              <Link
                to="/volunteer"
                className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-md border border-red px-3 text-[14px] font-semibold text-red hover:bg-red/5 xl:px-3.5"
              >
                {t.nav.volunteer}
              </Link>
              <Link
                to="/give"
                className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-md bg-red px-3.5 text-[14px] font-bold text-white hover:bg-red/90 xl:px-4"
              >
                {t.nav.donate}
              </Link>
              <Link
                to="/support"
                className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-md bg-teal px-3.5 text-[14px] font-bold text-white hover:bg-teal/90 xl:px-4"
              >
                {t.nav.askForHelp}
              </Link>
            </div>
          </div>

          {/* Actions — mobile: Donate + Ask for help + menu */}
          <div className="flex items-center justify-end gap-2 lg:hidden">
            <Link
              to="/give"
              className="header-compact inline-flex h-9 items-center whitespace-nowrap rounded-md bg-red px-2.5 text-[13px] font-semibold text-white sm:h-10 sm:px-3 sm:text-sm"
            >
              {t.nav.donate}
            </Link>
            <Link
              to="/support"
              className="header-compact inline-flex h-9 items-center whitespace-nowrap rounded-md bg-teal px-2.5 text-[13px] font-semibold text-white sm:h-10 sm:px-3 sm:text-sm"
            >
              {t.nav.askForHelp}
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
            className="border-t border-black/5 bg-white lg:hidden"
          >
            <nav className="mx-auto flex max-w-[1120px] flex-col px-4 py-2 sm:px-8">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center border-b border-black/5 text-[15px] font-medium text-navy"
                >
                  {item.label}
                </Link>
              ))}

              <div className="flex h-12 items-center gap-5 border-b border-black/5">
                <LanguageSwitch />
                <EasyReadToggle />
              </div>

              <div className="flex flex-col gap-2 py-4">
                {account ? (
                  <Link
                    to={account.href}
                    onClick={() => setOpen(false)}
                    className="flex h-11 items-center justify-center rounded-md border border-navy/20 text-[15px] font-semibold text-navy"
                  >
                    {account.label}
                  </Link>
                ) : (
                  <span
                    className="flex h-11 items-center justify-center rounded-md border border-navy/10 text-[15px] font-semibold text-navy/25"
                    aria-busy="true"
                  >
                    …
                  </span>
                )}
                <Link
                  to="/give"
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center justify-center rounded-md bg-red text-[15px] font-semibold text-white"
                >
                  {t.nav.donate}
                </Link>
                <Link
                  to="/support"
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center justify-center rounded-md bg-teal text-[15px] font-semibold text-white"
                >
                  {t.nav.askForHelp}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
